import nodemailer from "nodemailer";
import { nodemailerPass, nodemailerUser } from "../config";

export default nodemailer.createTransport({
  host: "smtp-relay.sendinblue.com",
  port: 587,
  auth: {
    user: nodemailerUser,
    pass: nodemailerPass,
  },
});
