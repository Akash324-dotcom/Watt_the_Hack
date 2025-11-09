import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        electric: "hsl(var(--electric-green))",
        neon: "hsl(var(--neon-yellow))",
        cyber: "hsl(var(--cyber-blue))",
        circuit: "hsl(var(--dark-circuit))",
        aqua: "hsl(180 100% 50%)",
        amber: "hsl(45 100% 51%)",
      },
      backgroundImage: {
        'gradient-nature': 'var(--gradient-nature)',
        'gradient-glow': 'var(--gradient-glow)',
        'gradient-cosmic': 'var(--gradient-cosmic)',
      },
      boxShadow: {
        'glow': 'var(--shadow-glow)',
        'card': 'var(--shadow-card)',
        'elevated': 'var(--shadow-elevated)',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        orbitron: ['Orbitron', 'sans-serif'],
        poppins: ['Poppins', 'sans-serif'],
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        spark: {
          "0%, 100%": { opacity: "0", transform: "scale(0.8) rotate(0deg)" },
          "50%": { opacity: "1", transform: "scale(1.2) rotate(180deg)" },
        },
        "electric-pulse": {
          "0%, 100%": { boxShadow: "0 0 5px hsl(var(--electric-green) / 0.5)" },
          "50%": { boxShadow: "0 0 20px hsl(var(--electric-green) / 0.8), 0 0 40px hsl(var(--electric-green) / 0.4)" },
        },
        flicker: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.8" },
          "75%": { opacity: "0.9" },
        },
        "bounce-fun": {
          "0%, 100%": { transform: "translateY(0) scale(1)" },
          "50%": { transform: "translateY(-15px) scale(1.05)" },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(0deg)" },
          "25%": { transform: "rotate(-5deg)" },
          "75%": { transform: "rotate(5deg)" },
        },
        hologram: {
          "0%, 100%": { 
            textShadow: "0 0 10px hsl(var(--electric-green)), 0 0 20px hsl(var(--cyber-blue))",
            transform: "translateY(0px)"
          },
          "50%": { 
            textShadow: "0 0 20px hsl(var(--neon-yellow)), 0 0 40px hsl(var(--electric-green))",
            transform: "translateY(-2px)"
          },
        },
        "spin-slow": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        "rainbow-shift": {
          "0%": { filter: "hue-rotate(0deg)" },
          "100%": { filter: "hue-rotate(360deg)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        spark: "spark 2s ease-in-out infinite",
        "electric-pulse": "electric-pulse 2s ease-in-out infinite",
        flicker: "flicker 3s ease-in-out infinite",
        "bounce-fun": "bounce-fun 2s ease-in-out infinite",
        wiggle: "wiggle 1s ease-in-out infinite",
        hologram: "hologram 3s ease-in-out infinite",
        "spin-slow": "spin-slow 20s linear infinite",
        "rainbow-shift": "rainbow-shift 5s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
