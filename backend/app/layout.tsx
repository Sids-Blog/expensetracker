export const metadata = {
  title: 'Finance Tracker API',
  description: 'Backend API for Personal Finance Tracker',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
