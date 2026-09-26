export default function SoundbitesPage() {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Soundbites</h1>
          <p>Clip utterances from any transcript hover toolbar. Clips appear here after you create them.</p>
        </div>
      </div>
      <div className="mf-empty">
        <h3>No soundbites yet</h3>
        <p>Open a meeting, hover an utterance, and choose the clip action.</p>
      </div>
    </div>
  );
}
