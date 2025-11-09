# Welcome to Your React + TypeScript Project

## 📘 Project Overview

This project is a modern web application built using **Vite**, **React**, **TypeScript**, **Tailwind CSS**, and **shadcn/ui**.  
It provides a fast development experience, strong typing, and elegant UI components.

---

## 🛠️ Getting Started

Follow these steps to set up and run the project locally:

### 2️⃣ Navigate to the Project Directory
```bash
cd <YOUR_PROJECT_NAME>
```

### 3️⃣ Install Dependencies
Make sure you have [Node.js](https://nodejs.org/) and [npm](https://www.npmjs.com/) installed.

```bash
npm install
```

### 4️⃣ Start the Development Server
Run the app locally with hot-reloading:
```bash
npm run dev
```

Then open your browser and visit:
```
http://localhost:8080
```

---

## 🧩 Tech Stack

- ⚡ **Vite** — Fast build tool and dev server  
- ⚛️ **React** — UI library for building user interfaces  
- 🔷 **TypeScript** — Type-safe JavaScript  
- 💅 **Tailwind CSS** — Utility-first CSS framework  
- 🧱 **shadcn/ui** — Modern, accessible React UI components  

---

## 🚀 Deployment

You can deploy this project to platforms such as:

- [Vercel](https://vercel.com/)
- [Netlify](https://www.netlify.com/)
- [Render](https://render.com/)
- [GitHub Pages](https://pages.github.com/)

To create a production build:
```bash
npm run build
```

Preview the production build locally:
```bash
npm run preview
```

---

## 🌐 Custom Domain

If deploying to a hosting service, you can connect a custom domain by following their documentation:

- **Vercel:** [Custom Domain Setup](https://vercel.com/docs/concepts/projects/custom-domains)  
- **Netlify:** [Add a Custom Domain](https://docs.netlify.com/domains-https/custom-domains/)  
- **Render:** [Custom Domain Guide](https://render.com/docs/custom-domains)

---

## 🧠 Contributing

1. **Fork this repository**  
2. **Create a new branch**
   ```bash
   git checkout -b feature/your-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m "Add new feature"
   ```
4. **Push your branch**
   ```bash
   git push origin feature/your-feature
   ```
5. **Open a Pull Request**

---

### 3️⃣ Set Up Environment Variables

Create a new file named **`.env`** in the project root and copy the contents from **`.env.example`**.  
Then, replace the placeholder text with your actual keys.

#### Example:
```bash
VITE_SUPABASE_PROJECT_ID="your_project_id_here"
VITE_SUPABASE_PUBLISHABLE_KEY="your_supabase_publishable_key_here"
VITE_SUPABASE_URL="your_supabase_url_here"
VITE_GOOGLE_MAPS_API_KEY="your_google_maps_api_key_here"
VITE_OPENWEATHER_API_KEY="your_openweather_api_key_here"
```

> ⚠️ **Important:**  
> Never commit your `.env` file to GitHub.  
> The `.gitignore` file ensures it remains private.


## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
