import Mail from "nodemailer/lib/mailer";
import { Attributes, CreationAttributes } from "sequelize";
import User from "src/models/User";

export const DBpopulateMailConfig
 = (
  mailID: string,
  usersData: { userName: string; password: string }[],
): Mail.Options => {
  try {

    return {
      from: mailID,
      to: mailID,
      subject: "Dummy Users Data",
      text: `Dummy Users Data`,
      attachments: [
        {
          filename: "Dummy_Users_Data.json",
          content: JSON.stringify(usersData),
        },
      ],
    };
  } catch (err) {
    throw err;
  }
};