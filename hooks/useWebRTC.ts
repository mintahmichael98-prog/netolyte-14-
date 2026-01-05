import { useState, useEffect, useRef, useCallback } from 'react';
import { signalingService } from '../services/signalingService';
import { CallState, CallSession, SignalingMessage, UserProfile } from '../types';
import toast from 'react-hot-toast';
import { authService } from '../services/authService';

export const useWebRTC = (currentUser: UserProfile | null) => {
  const [callState, setCallState] = useState<CallState>('idle');
  const [activeCall, setActiveCall] = useState<CallSession | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);

  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  // STUN servers for ICE candidate exchange (Google's public STUN)
  const rtcConfig = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
  };

  useEffect(() => {
    if (!currentUser) return;

    // Connect to signaling
    signalingService.identify(currentUser.id);

    // Setup Listener
    const handleSignal = async (msg: SignalingMessage) => {
      switch (msg.type) {
        case 'invite':
          if (callState !== 'idle') {
            // Busy signal
            signalingService.send({ type: 'reject', payload: { reason: 'busy' }, from: currentUser.id, to: msg.from });
            return;
          }
          handleIncomingCall(msg);
          break;
        case 'accept':
          handleCallAccepted(msg);
          break;
        case 'reject':
          handleCallRejected();
          break;
        case 'offer':
          handleOffer(msg);
          break;
        case 'answer':
          handleAnswer(msg);
          break;
        case 'candidate':
          handleCandidate(msg);
          break;
        case 'hangup':
          endCall(false); // Remote hung up
          toast('Call ended');
          break;
      }
    };

    signalingService.onMessage(handleSignal);

    return () => {
      signalingService.removeMessageListener(handleSignal);
    };
  }, [currentUser, callState]);

  // --- ACTIONS ---

  const startCall = async (receiverId: string, receiverName: string, video: boolean = false) => {
    if (!currentUser) return;
    
    setCallState('calling');
    const callId = `call_${Date.now()}`;
    
    setActiveCall({
      callId,
      callerId: currentUser.id,
      callerName: currentUser.name || 'Unknown',
      receiverId,
      receiverName,
      state: 'calling',
      isVideo: video
    });

    setIsVideoEnabled(video);

    // Send Invite
    signalingService.send({
      type: 'invite',
      payload: { callId, callerName: currentUser.name, video },
      from: currentUser.id,
      to: receiverId
    });

    // Update Status
    authService.updateStatus(currentUser.email, 'ringing');
  };

  const acceptCall = async () => {
    if (!activeCall || !currentUser) return;

    try {
      const constraints = { 
        audio: true, 
        video: activeCall.isVideo 
          ? { facingMode: 'user' } 
          : false 
      };

      // 1. Get Local Media
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      setIsVideoEnabled(activeCall.isVideo);

      // 2. Init PeerConnection
      const pc = new RTCPeerConnection(rtcConfig);
      peerConnection.current = pc;

      // 3. Add Tracks
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      // 4. Handle ICE
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          signalingService.send({
            type: 'candidate',
            payload: event.candidate,
            from: currentUser.id,
            to: activeCall.callerId
          });
        }
      };

      // 5. Handle Remote Stream
      pc.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
        // Audio is handled via ref, Video via UI attachment
        if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = event.streams[0];
            remoteAudioRef.current.play().catch(e => console.error("Autoplay failed", e));
        }
      };

      setCallState('connected');
      
      // 6. Send Accept Signal
      signalingService.send({
        type: 'accept',
        payload: { callId: activeCall.callId },
        from: currentUser.id,
        to: activeCall.callerId
      });
      
      // Update Status
      authService.updateStatus(currentUser.email, 'in-call');

    } catch (err) {
      console.error("Failed to accept call", err);
      toast.error("Media access denied");
      endCall();
    }
  };

  const rejectCall = () => {
    if (!activeCall || !currentUser) return;
    signalingService.send({
      type: 'reject',
      payload: { callId: activeCall.callId },
      from: currentUser.id,
      to: activeCall.callerId
    });
    setCallState('idle');
    setActiveCall(null);
  };

  const endCall = (notifyRemote = true) => {
    if (activeCall && currentUser && notifyRemote) {
      const target = currentUser.id === activeCall.callerId ? activeCall.receiverId : activeCall.callerId;
      signalingService.send({
        type: 'hangup',
        payload: { callId: activeCall.callId },
        from: currentUser.id,
        to: target
      });
    }

    // Teardown WebRTC
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }

    // Stop Tracks
    if (localStream) {
      localStream.getTracks().forEach(t => t.stop());
      setLocalStream(null);
    }
    setRemoteStream(null);
    setCallState('idle');
    setActiveCall(null);
    
    if (currentUser) authService.updateStatus(currentUser.email, 'online');
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
        const videoTrack = localStream.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = !videoTrack.enabled;
            setIsVideoEnabled(videoTrack.enabled);
        } else {
            // Upgrade audio call to video? 
            // In simple implementation, we just say no video available if track wasn't started
            toast("No video track available");
        }
    }
  };

  // --- HANDLERS ---

  const handleIncomingCall = (msg: SignalingMessage) => {
    setCallState('ringing');
    setActiveCall({
      callId: msg.payload.callId,
      callerId: msg.from,
      callerName: msg.payload.callerName || 'Unknown',
      receiverId: currentUser!.id,
      receiverName: currentUser!.name || 'Me',
      state: 'ringing',
      isVideo: msg.payload.video || false
    });
    // Play ringtone?
  };

  const handleCallAccepted = async (msg: SignalingMessage) => {
    // The caller receives this
    setCallState('connected');
    if(currentUser) authService.updateStatus(currentUser.email, 'in-call');
    
    // Start WebRTC negotiation
    try {
        // Use the stored intent from startCall
        const constraints = { 
            audio: true, 
            video: activeCall?.isVideo 
              ? { facingMode: 'user' } 
              : false 
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        setLocalStream(stream);
        setIsVideoEnabled(!!activeCall?.isVideo);

        const pc = new RTCPeerConnection(rtcConfig);
        peerConnection.current = pc;

        stream.getTracks().forEach(track => pc.addTrack(track, stream));

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                signalingService.send({
                    type: 'candidate',
                    payload: event.candidate,
                    from: currentUser!.id,
                    to: msg.from
                });
            }
        };

        pc.ontrack = (event) => {
            setRemoteStream(event.streams[0]);
            if (remoteAudioRef.current) {
                remoteAudioRef.current.srcObject = event.streams[0];
                remoteAudioRef.current.play();
            }
        };

        // Create Offer
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        
        signalingService.send({
            type: 'offer',
            payload: offer,
            from: currentUser!.id,
            to: msg.from
        });

    } catch (e) {
        console.error("Error starting call media", e);
        endCall();
    }
  };

  const handleCallRejected = () => {
    toast.error("Call declined");
    setCallState('idle');
    setActiveCall(null);
  };

  const handleOffer = async (msg: SignalingMessage) => {
    // The receiver receives the offer after accepting
    const pc = peerConnection.current;
    if (!pc || !currentUser) return;

    await pc.setRemoteDescription(new RTCSessionDescription(msg.payload));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    signalingService.send({
        type: 'answer',
        payload: answer,
        from: currentUser.id,
        to: msg.from
    });
  };

  const handleAnswer = async (msg: SignalingMessage) => {
    const pc = peerConnection.current;
    if (!pc) return;
    await pc.setRemoteDescription(new RTCSessionDescription(msg.payload));
  };

  const handleCandidate = async (msg: SignalingMessage) => {
    const pc = peerConnection.current;
    if (!pc) return;
    try {
        await pc.addIceCandidate(new RTCIceCandidate(msg.payload));
    } catch (e) {
        console.error("Error adding ICE candidate", e);
    }
  };

  return {
    callState,
    activeCall,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
    isMuted,
    isVideoEnabled,
    localStream,
    remoteStream,
    remoteAudioRef
  };
};