import agoraToken from 'agora-token';
const { RtcTokenBuilder, RtcRole } = agoraToken;


const APP_ID = process.env.AGORA_APP_ID;
const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE;

/**
 * Generate Agora RTC token for video call
 * @route POST /api/agora/token
 */
export const generateToken = async (req, res) => {
  try {
    const { channelName, uid, role = 'publisher' } = req.body;

    if (!channelName) {
      return res.status(400).json({ 
        success: false, 
        message: 'Channel name is required' 
      });
    }

    if (!APP_ID || !APP_CERTIFICATE) {
      return res.status(500).json({ 
        success: false, 
        message: 'Agora credentials not configured' 
      });
    }

    // Set token expiration time (24 hours from now)
    const expirationTimeInSeconds = 3600 * 24;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    // Determine role
    const userRole = role === 'audience' ? RtcRole.SUBSCRIBER : RtcRole.PUBLISHER;

    // Generate UID if not provided (0 means Agora will assign one)
    const userId = uid || 0;

    // Build token
    const token = RtcTokenBuilder.buildTokenWithUid(
      APP_ID,
      APP_CERTIFICATE,
      channelName,
      userId,
      userRole,
      privilegeExpiredTs
    );

    res.json({
      success: true,
      token,
      appId: APP_ID,
      channelName,
      uid: userId,
      expiresIn: expirationTimeInSeconds
    });

  } catch (error) {
    console.error('Error generating Agora token:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate token',
      error: error.message 
    });
  }
};

/**
 * Renew Agora RTC token
 * @route POST /api/agora/token/renew
 */
export const renewToken = async (req, res) => {
  try {
    const { channelName, uid } = req.body;

    if (!channelName || !uid) {
      return res.status(400).json({ 
        success: false, 
        message: 'Channel name and UID are required' 
      });
    }

    // Generate new token with same parameters
    const expirationTimeInSeconds = 3600 * 24;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    const token = RtcTokenBuilder.buildTokenWithUid(
      APP_ID,
      APP_CERTIFICATE,
      channelName,
      uid,
      RtcRole.PUBLISHER,
      privilegeExpiredTs
    );

    res.json({
      success: true,
      token,
      expiresIn: expirationTimeInSeconds
    });

  } catch (error) {
    console.error('Error renewing Agora token:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to renew token',
      error: error.message 
    });
  }
};
