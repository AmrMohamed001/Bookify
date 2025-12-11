const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

module.exports = class SendEmail {
  constructor(user, url) {
    this.to = user.email;
    this.from = 'admin@natours.io';
    this.url = url;
    this.firstName = user.firstName;
  }

  transporter() {
    if (process.env.NODE_ENV === 'production') {
      // SendGrip
      return nodemailer.createTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.SendEmail_EMAIL,
          pass: process.env.SendEmail_PASSWORD,
        },
      });
    }
    return nodemailer.createTransport({
      host: 'sandbox.smtp.mailtrap.io',
      port: 587,
      auth: {
        user: process.env.MAILTRAP_USER,
        pass: process.env.MAILTRAP_PASSWORD,
      },
    });
  }

  async send(templete, subject) {
    // 1) Render html based on pug templete
    const html = pug.renderFile(
      `${__dirname}/../views/emails/${templete}.pug`,
      {
        firstName: this.firstName,
        url: this.url,
        subject,
      }
    );
    // 2) Define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      text: htmlToText.htmlToText(html),
      html,
    };
    // 3) create transport and send email
    await this.transporter().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to Bookify family 👍');
  }

  async sendVerifyEmail() {
    await this.send('verifyEmail', 'Your email verification token');
  }

  async sendResetPassword() {
    await this.send(
      'passwordReset',
      'Your password reset token (Valid for 10 min)'
    );
  }
};
