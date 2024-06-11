import { CreateUser, VerifyEmailRequest } from "#/@types/user";
import User from "#/models/user";
import jwt from "jsonwebtoken";
import { generateToken } from "#/utils/helper";
import { RequestHandler } from "express";
import {
  sendForgetPasswordLink,
  sendPassResetSuccessEmail,
  sendVerificationMAil,
} from "#/utils/mail";
import EmailVerificationToken from "#/models/emailVerificationToken";
import PasswordResetToken from "#/models/passwordResetToken";
import { isValidObjectId } from "mongoose";
import crypto from "crypto";
import { JWT_SECRET, PASSWORD_RESET_LINK } from "#/utils/variables";
import cloudinary from "#/cloud";
import formidable from "formidable";
import { RequestWithFiles } from "#/middleware/fileParser";
import { log } from "console";

export const create: RequestHandler = async (req: CreateUser, res) => {
  const { name, email, password } = req.body;
  // CreateUserSchema.validate({ email, password, name }).catch((error) => {});
  // if (!name.trim()) return res.json({ error: "Name is missing!" });
  // if (name.length < 3) return res.json({ error: "Invalid name!" });
  // next();
  // },
  // async (req: CreateUser, res) => {
  // const { name, email, password } = req.body;
  //   const newUser = new User({ name, email, password });
  //   newUser.save();

  const user = await User.create({ name, email, password });

  // send verification
  const token = generateToken();
  await EmailVerificationToken.create({
    owner: user._id,
    token,
  });
  sendVerificationMAil(token, { name, email, userId: user._id.toString() });

  res.status(201).json({ user: { id: user._id, name, email } });
};

export const verifyEmail: RequestHandler = async (
  req: VerifyEmailRequest,
  res
) => {
  const { token, userId } = req.body;

  // find the token by the owner which is the userId
  const verificationToken = await EmailVerificationToken.findOne({
    owner: userId,
  });

  // If there is no token available, we throw an error message and not go further
  if (!verificationToken)
    return res.status(403).json({ error: "Invalid token" });

  // If there is token, we just compare and return a boolean
  const matched = await verificationToken.compareToken(token);

  // If there is token but does not match we throw error and not continue
  if (!matched) return res.status(403).json({ error: "Invalid token" });
  // If matched we go ahead to update the User => set verifed property to "true"
  await User.findByIdAndUpdate(userId, {
    verified: true,
  });

  // After verification, there is no need to still return the email verification token, hence we delete from database and throw congratulatory message
  await EmailVerificationToken.findByIdAndDelete(verificationToken._id);
  res.json({ message: "Congratulations, verification succesfull" });
};

export const sendReVerificationToken: RequestHandler = async (req, res) => {
  const { userId } = req.body;

  // chech to invalid userId or not (objectId)
  if (!isValidObjectId(userId))
    return res.status(403).json({ error: "Invalid request!" });

  // check if the user exist in our application or database first
  // if not abort
  const user = await User.findById(userId);
  if (!user) return res.status(403).json({ error: "Invalid request!" });

  // if user exist, proceed to remove the last token
  await EmailVerificationToken.findOneAndDelete({
    owner: userId,
  });

  // After removing token,
  // regenerate another verification token
  const token = generateToken();

  // store the new token into the database
  await EmailVerificationToken.create({
    owner: userId,
    token,
  });

  // Send the verification token to user.
  // This request could aswell be invalid, hence the need to run the checks above
  sendVerificationMAil(token, {
    name: user?.name,
    email: user?.email,
    userId: user?._id.toString(),
  });

  res.json({ message: "A verification email has been sent to you inbox!" });
};

export const generateForgetPasswordLink: RequestHandler = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ error: "Account not found" });

  // if user is in database generate link
  // http://your app.com/reset-password?token=hjhjhghjgjgjh&userId=67676gh

  const token = crypto.randomBytes(36).toString("hex");

  await PasswordResetToken.findOneAndDelete({
    owner: user._id,
  });

  await PasswordResetToken.create({
    owner: user._id,
    token,
  });

  const resetLink = `${PASSWORD_RESET_LINK}?token=${token}&userId=${user._id}`;

  sendForgetPasswordLink({ email: user.email, link: resetLink });

  res.json({
    message: "Please check your registered email to reset you password",
  });
};

export const grantValid: RequestHandler = async (req, res) => {
  const { token, userId } = req.body;

  const resetToken = await PasswordResetToken.findOne({ owner: userId });
  if (!resetToken)
    return res
      .status(403)
      .json({ error: "Unauthorized access: Invalid token!" });

  const matched = await resetToken.compareToken(token);
  if (!matched)
    return res
      .status(403)
      .json({ error: "Unauthorized access: Invalid token!" });

  res.json({ valid: true });
};

export const updatePassword: RequestHandler = async (req, res) => {
  const { password, userId } = req.body;

  const user = await User.findById(userId);

  if (!user) return res.status(403).json({ error: "Unauthorized access!" });

  const matched = await user.comparePassword(password);
  if (matched)
    return res
      .status(422)
      .json({ error: "The new password must be different from the old one!" });

  user.password = password;
  await user.save();

  await PasswordResetToken.findOneAndDelete({ owner: user._id });

  sendPassResetSuccessEmail(user.name, user.email);

  res.json({ message: "Password reset succesfully" });
};
export const signIn: RequestHandler = async (req, res) => {
  const { password, email } = req.body;

  const user = await User.findOne({ email });
  if (!user)
    return res.status(403).json({ error: "Email or Password has a mismatch!" });

  // compare the password
  const matched = await user.comparePassword(password);
  if (!matched)
    return res.status(403).json({ error: "Email or Password has a mismatch!" });

  // if matched generate token
  const token = jwt.sign({ userId: user._id }, JWT_SECRET);
  user.token.push(token);

  await user.save();

  res.json({
    profile: {
      id: user._id,
      name: user.name,
      email: user.email,
      verified: user.verified,
      avatar: user.avatar?.url,
      followers: user.followers.length,
      followings: user.followings.length,
    },
    token,
  });
};

export const updateProfile: RequestHandler = async (
  req: RequestWithFiles,
  res
) => {
  const { name } = req.body;
  const avatar = req.files?.avatar as formidable.File;

  const user = await User.findById(req.user.id);
  if (!user) throw new Error("something went wrong, user not found!");

  if (typeof name !== "string")
    return res.status(422).json({ error: "Invalid name!" });

  if (name.trim().length < 3)
    return res.status(422).json({ error: "Invalid name!" });

  user.name = name;

  if (avatar) {
    // if there is already an avatar file, we want to remove that

    // upload new avatar file
    const { secure_url, public_id } = await cloudinary.uploader.upload(
      avatar.filepath,
      {
        width: 300,
        height: 300,
        crop: "thumb",
        gravity: "face",
      }
    );

    user.avatar = { url: secure_url, publicId: public_id };
  }

  await user.save();

  res.json({ avatar: user.avatar });
};
