# MPSTME Notes Portal

A modern, scalable file-sharing platform for MPSTME students, enabling seamless sharing and storage of notes, assignments, and resources. Built with Next.js, Clerk, Prisma, and Telegram for unlimited, free file storage.

## 🚀 Features

- **Public Shared Folders:** Collaborative file sharing by subject, with dedicated Telegram channels for each subject and type (Main, Theory, Practical, Public).
- **Private Notes Storage:** Secure, user-specific storage for personal notes, tracked via Prisma.
- **Unlimited Storage:** Leverages Telegram channels for free, scalable file storage.
- **Modern UI:** Built with Next.js and shadcn/ui for a clean, responsive experience.
- **Robust Upload/Download:** Supports any file type, chunked uploads for large files, and seamless downloads.
- **Authentication:** Secure login and user management via Clerk.
- **Error Handling:** Smooth operation across browsers, with clear feedback and robust backend logic.

## 🛠️ Tech Stack

- **Frontend:** Next.js, React, shadcn/ui
- **Backend:** Next.js API routes, Prisma ORM
- **Authentication:** Clerk
- **Database:** PostgreSQL (via Prisma)
- **Storage:** Telegram Channels (via TelegramClient)

## 🗂️ How It Works

- **Public Sharing:** Files uploaded to public subject folders are sent to dedicated Telegram channels. Anyone can view/download; uploader’s username is shown.
- **Private Notes:** Files uploaded privately are linked to your account and stored in Telegram, with ownership tracked in the database.
- **Chunked Uploads:** Large files are split and uploaded in chunks, ensuring reliability.
- **Download:** Files are streamed from Telegram via backend API for fast, secure downloads.

## 📦 Project Structure

- `src/app/api/` — API routes for uploads, downloads, file listing, subjects, channels, and dashboard stats
- `src/components/` — UI components (Select, Card, FilePreview, etc.)
- `prisma/schema.prisma` — Database models for users, files, messages, and subjects
- `src/scripts/generate-telegram-session.ts` — Script to generate Telegram session strings

## ⚙️ Setup & Installation

1. **Clone the repo:**
   ```bash
   git clone https://github.com/yourusername/mpstme-notes-portal.git
   cd mpstme-notes-portal
   ```
2. **Install dependencies:**
   ```bash
   pnpm install # or npm/yarn/bun
   ```
3. **Configure environment variables:**
   Create a `.env.local` file with:
   ```env
   DATABASE_URL=postgresql://user:password@host:port/dbname
   TELEGRAM_API_ID=your_telegram_api_id
   TELEGRAM_API_HASH=your_telegram_api_hash
   TELEGRAM_SESSION=your_telegram_session_string
   CLERK_SECRET_KEY=your_clerk_secret_key
   CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   # ...any other required keys
   ```
4. **Generate Prisma client & migrate DB:**
   ```bash
   npx prisma generate
   npx prisma migrate deploy
   ```
5. **Run the development server:**
   ```bash
   pnpm dev
   # or npm/yarn/bun
   ```

## 📝 Usage

- **Upload Files:** Select subject/type, choose any file, and upload. For large files, chunked upload is supported.
- **Download Files:** Click on any file card to download. Public files show uploader info.
- **Notes Section:** Store and manage your private notes securely.

## 🧑‍💻 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you’d like to change.

## 📄 License

MIT

---

> Built for MPSTME students. Powered by Next.js, Clerk, Prisma, and Telegram.
