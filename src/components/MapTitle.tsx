type Props = {
  title: string;
  subtitle?: string; // optional, if you ever want a small line under the title
};

export default function MapTitle({ title, subtitle }: Props) {
  return (
    <div className="map-title">
      <div className="map-title__text">{title}</div>
      {subtitle ? <div className="map-title__sub">{subtitle}</div> : null}
    </div>
  );
}
