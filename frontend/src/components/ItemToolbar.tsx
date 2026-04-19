import { items } from '../data/items';

export default function ItemToolbar() {
  return (
    <div className="card">
      <h3>Item Toolbar</h3>
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <strong>{item.name}</strong> — {item.cost} budget
            <div>{item.description}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
