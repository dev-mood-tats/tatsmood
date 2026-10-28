// Hueco de la ficha de producto mientras carga: mismas medidas que la ficha real (foto 4:5
// con sus márgenes y la barra de scroll en móvil), para que al llegar el contenido no se
// mueva nada. Ocupa al menos una pantalla para que no asome el footer.
export function ProductPageSkeleton() {
  return (
    <div className="flex min-h-[100svh] flex-col pb-24 lg:-mt-16 lg:flex-row-reverse">
      <div className="lg:w-2/3">
        <div className="mx-5 aspect-[4/5] lg:mx-0" />
        <div className="mx-5 mt-[8px] h-[2px] lg:hidden" />
      </div>
      <div className="px-5 pt-[30px] lg:w-1/3 lg:px-[15px] lg:pt-0" />
    </div>
  );
}
