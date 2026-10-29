export default function Home() {
  return (
    <main className="mx-auto max-w-xl p-8">
      <h1 className="text-2xl font-semibold">Receipts service</h1>
      <p className="mt-2 text-gray-600">
        Receipts are created via <code>POST /api/receipts</code> and viewed at{" "}
        <code>/r/[id]</code>.
      </p>
    </main>
  );
}
