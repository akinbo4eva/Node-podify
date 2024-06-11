import { generateToken } from "#/utils/helper";
import {
  MAILTRAP_PASS,
  MAILTRAP_USER,
  SIGN_IN_URL,
  VERIFICATION_EMAIL,
} from "#/utils/variables";
import nodemailer from "nodemailer";
import EmailVerificationToken from "#/models/emailVerificationToken";
import { generateTemplate } from "#/mail/template";
import path from "path";
import { env } from "process";

const generateTransporter = () => {
  const transport = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: MAILTRAP_USER,
      pass: MAILTRAP_PASS,
    },
  });
  return transport;
};

// const token = generateToken();

interface Profile {
  name: string;
  email: string;
  userId: string;
}

export const sendVerificationMAil = async (token: string, profile: Profile) => {
  const transport = generateTransporter();

  const { name, email, userId } = profile;

  //   await EmailVerificationToken.create({
  //     owner: userId,
  //     token,
  //   });

  const welcomeMessage = `Hi ${name}, welcome to podify! There are so much things 
  that we do for verified users. Use the following OTP to verify your email.`;

  transport.sendMail({
    to: email,
    from: VERIFICATION_EMAIL,
    subject: "Welcome message",
    html: generateTemplate({
      title: "Welcome to Podify",
      message: welcomeMessage,
      logo: "cid:logo",
      banner: "cid:welcome",
      link: "#",
      btnTitle: token,
    }),

    attachments: [
      {
        filename: "logo.png",
        path: path.join(__dirname, "../mail/logo.png"),
        cid: "logo",
      },
      {
        filename: "welcome.png",
        path: path.join(__dirname, "../mail/welcome.png"),
        cid: "welcome",
      },
    ],
  });
};

interface Options {
  email: string;
  link: string;
}
export const sendForgetPasswordLink = async (options: Options) => {
  const transport = generateTransporter();

  const { email, link } = options;

  const message =
    "We received a request that you forgot your password. You can use the link below to create a new one";

  transport.sendMail({
    to: email,
    from: VERIFICATION_EMAIL,
    subject: "Reset Password Link",
    html: generateTemplate({
      title: "Forget Password",
      message: message,
      logo: "cid:logo",
      banner: "cid:forget_password",
      link,
      btnTitle: "Reset Password",
    }),

    attachments: [
      {
        filename: "logo.png",
        path: path.join(__dirname, "../mail/logo.png"),
        cid: "logo",
      },
      {
        filename: "forget_password.png",
        path: path.join(__dirname, "../mail/forget_password.png"),
        cid: "forget_password",
      },
    ],
  });
};

export const sendPassResetSuccessEmail = async (
  name: string,
  email: string
) => {
  const transport = generateTransporter();

  const message = `Dear ${name}, we just updated your new password. You can now sign in with your new password`;
  transport.sendMail({
    to: email,
    from: VERIFICATION_EMAIL,
    subject: "Password reset successfull!",
    html: generateTemplate({
      title: "Password reset successfull!",
      message: message,
      logo: "cid:logo",
      banner: "cid:forget_password",
      link: SIGN_IN_URL,
      btnTitle: "Log in",
    }),

    attachments: [
      {
        filename: "logo.png",
        path: path.join(__dirname, "../mail/logo.png"),
        cid: "logo",
      },
      {
        filename: "forget_password.png",
        path: path.join(__dirname, "../mail/forget_password.png"),
        cid: "forget_password",
      },
    ],
  });
};
