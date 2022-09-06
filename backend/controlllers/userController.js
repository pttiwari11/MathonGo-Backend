import UserModel from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import transporter from "../config/emailConfig.js"

class UserController {
  static userRegistration = async (req, res) => {
    const { firstName, lastName, email, password, tc } = req.body;
    const user = await UserModel.findOne({ email: email });
    if (user) {
      res.send({ status: "failed", message: "Email already exists" });
    } else {
      if (firstName && lastName && email && password && tc) {
        try {
          const salt = await bcrypt.genSalt(10);
          const hashPassword = await bcrypt.hash(password, salt);
          const newUser = new UserModel({
            name: firstName + " " + lastName,
            email: email,
            password: hashPassword,
            tc: tc,
          });
          await newUser.save();
          const saved_user = await UserModel.findOne({email: email})

          // Generate JWT Token
          const token = jwt.sign({userID: saved_user._id}, process.env.JWT_SECRET_KEY, { expiresIn: '1d'})

          res.status(201).send({status: "success", message: "Registration Successfull", "token": token });
        } catch (error) {
          console.log(error);
          res.send({ status: "failed", message: "Unablle to register" });
        }
      } else {
        res.send({ status: "failed", message: "All fields are required" });
      }
    }
  };

  static userLogin = async (req, res) => {
    try {
      const {nameORemail, password} = req.body
      if ((nameORemail && password)) {
        const user = await UserModel.findOne({ email: nameORemail } || { name: nameORemail })
        if (user != null) {
          const isMatch = await bcrypt.compare(password, user.password)
          if ((user.email === nameORemail || user.name === nameORemail) && isMatch) {

            // Generate Token
            const token = jwt.sign(
              { userID: user._id },
              process.env.JWT_SECRET_KEY,
              { expiresIn: "1d" }
            );
            res.send({ status: "success", message: "SignIn Successfull", "token": token})
          } else {
            res.send({ status: "failed", message: "Input Credentials not Valid" })
          }
        } else {
          res.send({status: "failed", message: "You are not a Registered User" })
        }
      } else {
        res.send({ status: "failed", message: "All Fields are Required"})
      }
    } catch (error) {
      console.log(error)
      res.send({ status: "failed", message: "Unable to SignIn" })
    }
  }

  static changeUserPassword = async(req, res) => {
    const {password} = req.body
    if (password) {
      const salt = await bcrypt.genSalt(10)
      const newHashPassword = await bcrypt.hash(password, salt)
      await UserModel.findByIdAndUpdate(req.user._id, {$set: { password: newHashPassword } })
      res.send({ status: "success", message: "Password Changed Successfully" })
    } else {
      res.send({ status: "failed", message: "Field is Empty"})
    }
  }

  static loggedUser = async(req, res) => {
    res.send({ "user": req.user })
  }

  static sendUserResetPasswordEmail = async (req, res) => {
    const { email } = req.body;
    if (email) {
      const user = await UserModel.findOne({ email: email })
      
      if (user) {
        const secret = user._id + process.env.JWT_SECRET_KEY;
        const token = jwt.sign({ userID: user._id }, secret, { expiresIn: '15m' })
        const link = `http://127.0.0.1:3000/api/user/reset/${user._id}/${token}`
        console.log(link)

        try {
          // Send Email
          let info = await transporter.sendMail({
            from:process.env.EMAIL_FROM,
            to: user.email,
            subject:"MathionGo - Password Reset Verification Code",
            html:`<h2>${Math.floor((Math.random() * 1000000) + 1)}</h2>`
          })

          res.send({ status: "success", message: "Password Reset Email Sent... Please Check Your Email", "info": info })
        } catch (error) {
          res.send({status: "failed", message: "Email not Sending"})
          console.log(error)
        }
        
      } else {
        res.send({ status: "failed", message: "Email doesn't exists"})
      }
    } else {
      res.send({ status: "failed", message: "Email Feild is Required"})
    }
  }

  static userPasswordReset = async (req, res) => {
    const { password } = req.body
    const {id, token} = req.params
    const user = await UserModel.findById(id)
    const new_secret = user._id + process.env.JWT_SECRET_KEY
    try {
      jwt.verify(token, new_secret)
      if(password) {
        const salt = await bcrypt.genSalt(10)
        const newHashPassword = await bcrypt.hash(password, salt)
        await UserModel.findByIdAndUpdate(id, { $set: { password: newHashPassword } })
        res.send({ status: "success", message: "Password Reset Successfully" })
      } else {
        res.send({ status: "failed", message: "Password Field is Required"})
      }
    } catch (error) {
      console.log(error)
      res.send({ status: "failed", message: "Invalid Token" })
    }
  }
}

export default UserController;