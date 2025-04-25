/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./views/*.ejs",
    "./views/users_view/*.ejs",
    "./public/**/*.html",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1a202c',
        secondary: '#2d3748',
        accent: '#ecc94b',
        background: '#f7fafc',
        text: '#2d3748',
        button: '#e53e3e',
        customGreen: '#48bb78',
        customBlue: '#3182ce',
      },
    },
  },
  plugins: [],
}