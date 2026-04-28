/**
 * @file auth.controller.js
 * @module auth
 * @desc Handles HTTP requests and responses for authentication.
 * @author I.M.L.S. Idirisinghe (S/21/389)
 */

const {register, login} = require('./auth.service');

/**
 * Handles POST/ api/ auth/ register
 * @param {object} req - Express request
 * @param {object} res - Express response 
 */

const registerController = async (req, res) => {
    try {
        const {email, phone, password, role, profileData} = req.body;

        //Validate required fields
        if (!email || !phone || !password || !role) {
            return res.status(400).json({
                success: false,
                message:'Email, phone, password and role are required'
            });
        }

        //Validate role
        if (!['patient','doctor'].includes(role)){
            return res.status(400).json({
                success: false,
                message:'Role must be patient or doctor'
            });
        }

        // Validate password length
        if (password.length<8) {
            return res.status(400).json({
                success: false,
                message:'Password must be at leaset 8 characters'
            });
        }

        const result = await register(email, phone, password, role, profileData || {});

        return res.status(201).json({
            success: true,
            message: 'Registration successful',
            data: {
                user: result.user,
                profile:result.profile
            }
        });

    } catch(error) {
      console.error('registerController error: ',error);

      if(error.message === 'Email already registered') {
    return res.status(400).json({
        success: false,
        message: error.message
    });
}

if(error.code === '23505') {
    return res.status(400).json({
        success: false,
        message: 'Email or phone number already registered'
    });
}

      return res.status(500).json({
        success:false,
        message: 'Internal server error'
      });
    }
};

/**
 * Handles POST /api/auth/login
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const user = await login(email, password);

    // Save user to session
    req.session.user = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('loginController error:', error);

    if (error.message === 'Invalid email or password') {
      return res.status(401).json({
        success: false,
        message: error.message
      });
    }

    if (error.message === 'Account is deactivated. Please contact admin.') {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Handles POST /api/auth/logout
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */

const logoutController = (req,res) => {
    req.session.destroy((err) => {
        if(err){
            return res.status(500).json({
                success:false,
                message:'Logout failed'
            });
        }
        res.clearCookie('connect.sid');
        return res.status(200).json({
            success: true,
            message: 'Logged out successfully'
        });
    });
};

/**
 * Handles GET api/auth/me
 * Returns the currently logged in user from session
 * @param {object} res - Express request
 * @param {object} res - Express response
 */

const getMeController = (req, res) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated'
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Session active',
    data: req.session.user
  });
};

module.exports = { registerController, loginController, logoutController, getMeController };