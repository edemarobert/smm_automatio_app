import '../styles/components/Spinner.css';

export default function Spinner({ size = 'medium', variant = 'default' }) {
  return (
    <div className={`spinner spinner-${size} spinner-${variant}`}>
      <div className="spinner-ring"></div>
      <div className="spinner-ring"></div>
      <div className="spinner-ring"></div>
      <div className="spinner-ring"></div>
    </div>
  );
}
