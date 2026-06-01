import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request: Request) {
  const formData = await request.formData();

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const placement = formData.get("placement") as string;
  const size = formData.get("size") as string;
  const style = (formData.get("style") as string) || "Non précisé";
  const message = formData.get("message") as string;

  if (!name || !email || !placement || !size || !message) {
    return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const html = `
    <h2>Nouvelle demande de tatouage</h2>
    <p><strong>Nom :</strong> ${name}</p>
    <p><strong>Email :</strong> ${email}</p>
    <p><strong>Emplacement :</strong> ${placement}</p>
    <p><strong>Taille :</strong> ${size}</p>
    <p><strong>Style :</strong> ${style}</p>
    <h3>Description du projet</h3>
    <p>${message.replace(/\n/g, "<br>")}</p>
  `;

  try {
    await transporter.sendMail({
      from: `"${name}" <${process.env.SMTP_USER}>`,
      replyTo: email,
      to: process.env.CONTACT_EMAIL,
      subject: `Demande de tatouage — ${name}`,
      html,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Email send failed:", err);
    return NextResponse.json({ error: "Échec de l'envoi" }, { status: 500 });
  }
}
