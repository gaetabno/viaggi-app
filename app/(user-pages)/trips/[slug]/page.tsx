 export default async function TripPageSlug({params}: {params: Promise<{ slug: string }>
}) {
  const { slug } = await params;
  return (
    <main>
      <h1>Trip</h1>
      <p>{slug}</p>
    </main>
  );
}
