export default function CityMap() {
  const tiles = Array.from({ length: 100 }, (_, index) => index);

  return (
    <div className="card">
      <h3>City Map</h3>
      <div className="grid">
        {tiles.map((tile) => (
          <div key={tile} className="tile" />
        ))}
      </div>
    </div>
  );
}
