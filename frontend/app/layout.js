export const metadata = {
  title: 'Netflix Recommender',
  description: 'AI-powered show & movie recommendations',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
