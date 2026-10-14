export default function Home() {
  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 sm:px-12">
      <header className="flex items-center justify-between border-b border-[#172c49]/15 py-8">
        <span className="text-xl font-semibold tracking-tight">Entre páginas</span>
        <span className="text-sm text-[#53647a]">Club de lectura</span>
      </header>

      <main className="grid flex-1 items-center gap-14 py-20 md:grid-cols-[1.3fr_1fr]">
        <section>
          <h1 className="max-w-xl font-serif text-5xl leading-[1.1] tracking-tight sm:text-7xl">
            Cada libro abre una conversación.
          </h1>
          <p className="mt-8 max-w-md text-lg leading-relaxed text-[#53647a]">
            Un lugar para reunir las historias que nos acompañan y descubrir
            nuestra próxima lectura.
          </p>
          <p className="mt-10 inline-block rounded-full bg-[#e2eccf] px-5 py-3 text-sm font-medium text-[#354d21]">
            Estamos preparando nuestro catálogo
          </p>
        </section>

        <div aria-hidden="true" className="flex h-72 items-end justify-center gap-3 rounded-t-[100px] bg-[#e7edf5] px-8 pb-8 sm:h-96">
          <div className="flex h-48 w-16 items-center justify-center rounded-r-md bg-[#294c73] shadow-md sm:h-64 sm:w-20">
            <span className="font-serif text-xl text-white [writing-mode:vertical-rl]">Historias que unen</span>
          </div>
          <div className="flex h-56 w-16 -rotate-6 items-center justify-center rounded-r-md bg-[#a9bd8c] shadow-md sm:h-72 sm:w-20">
            <span className="font-serif text-xl text-[#263d24] [writing-mode:vertical-rl]">Una página más</span>
          </div>
          <div className="flex h-44 w-16 items-center justify-center rounded-r-md bg-[#d5b768] shadow-md sm:h-56 sm:w-20">
            <span className="font-serif text-xl text-[#493e20] [writing-mode:vertical-rl]">Nuevos mundos</span>
          </div>
        </div>
      </main>

      <footer className="border-t border-[#172c49]/15 py-6 text-sm text-[#53647a]">
        Las buenas historias se disfrutan en compañía.
      </footer>
    </div>
  );
}
