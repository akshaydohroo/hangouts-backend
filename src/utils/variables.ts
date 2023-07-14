import Mail from "nodemailer/lib/mailer";
import { Attributes, CreationAttributes } from "sequelize";
import { hostDomainName, port } from "../config";
import User from "../models/User";

export const verifyMailConfig = (
  user: Attributes<User> | CreationAttributes<User>,
  verifyJwt: string
): Mail.Options => {
  try {
    const verifyUrl = `http://${hostDomainName}:${port}/auth/verify-email/${verifyJwt}`;
    const delUrl = `http://${hostDomainName}:${port}/auth/del/${verifyJwt}`;
    return {
      from: "hangouts.india3@gmail.com",
      to: user.email,
      subject: "Email Verification",
      text: `Verify email by clicking on the link given below
    --->
    ${verifyUrl}

    If you have not registered on hangouts please ignore this email
    or click on the link given below to remove your profile from hangouts
    --->
    ${delUrl}

    Note: Links will expire at 1 hour after recieving this email`,
      html: `<div><h2>Hola ${user.name}</h2>
    <img src="cid:email-verify" style="height:400px;"/>
    <h3>Welcome to hangouts, Complete your email verification by clicking on the link given below</h3>
    <p><a >${verifyUrl}</a></p>
    <h3>If not you please ignore the email or click on the link given below to remove your registration</h3>
    <p><a >${delUrl}</a></p>
    <p>Note: Links will expire at 1 hour after recieving this email</p></div>`,

      attachments: [
        {
          filename: "email-verify",
          path: `${process.cwd()}/src/assets/images/mail-verify.jpg`,
          cid: "email-verify",
        },
      ],
    };
  } catch (err) {
    throw err;
  }
};
