export const metadata = {
  title: 'CineMatch',
  description: 'AI-powered show & movie recommendations with Hybrid KNN',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
