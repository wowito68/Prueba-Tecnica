import { Brand } from "../ui/brand";

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="auth-layout">
      <aside className="auth-story">
        <Brand />
        <div className="auth-story-content">
          <div className="book-composition" aria-hidden="true">
            <div className="cover cover-green">
              <span>
                Entre
                <br />
                páginas
              </span>
              <small>Historias para compartir</small>
            </div>
            <div className="cover cover-coral">
              <span>
                Una
                <br />
                página
                <br />
                más.
              </span>
              <small>Club de lectura</small>
            </div>
          </div>
          <h2>
            Las buenas historias
            <br />
            se disfrutan en compañía.
          </h2>
          <p>Un libro, una conversación y nuevas formas de mirar el mundo.</p>
        </div>
        <p className="story-footnote">
          Nuestro punto de encuentro está entre páginas.
        </p>
      </aside>
      <section className="auth-content">{children}</section>
    </main>
  );
}
