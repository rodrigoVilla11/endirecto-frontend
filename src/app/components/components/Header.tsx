import Buttons from "./Buttons";

const Header = ({ headerBody }: any) => {
  return (
    <div
      className="
      h-auto mb-4 mx-4
      p-4
      flex flex-col gap-4
      rounded-2xl
      bg-white/5 backdrop-blur
      border border-white/10
      shadow-2xl
    "
    >
      {/* Sección de Botones */}
      <div className="flex flex-wrap justify-end items-center w-full border-b border-white/10 pb-4 gap-3">
        {headerBody.buttons.map((button: any, index: number) => (
          <Buttons
            key={index}
            logo={button.logo}
            title={button.title}
            onClick={button.onClick}
            red={button.red}
            disabled={button.disabled}
          />
        ))}
      </div>

      {/* Segunda Sección */}
      {headerBody.secondSection && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full border-b border-white/10 pb-4 gap-3">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-white/80 text-sm">
              {headerBody.secondSection.title}
              <span className="font-extrabold pl-2 text-xl text-[#E10600]">
                {headerBody.secondSection.amount}
              </span>
            </p>
          </div>

          {headerBody.secondSection.total && (
            <div className="font-medium text-white/70 text-sm bg-white/5 px-4 py-2 rounded-full border border-white/10 shadow-lg">
              {headerBody.secondSection.total}
            </div>
          )}
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap justify-start items-center w-full gap-3 p-3 bg-white/5 rounded-xl backdrop-blur z-30 border border-white/10">
        {headerBody.filters.map((filter: any, index: number) => (
          <div key={index} className="w-full sm:w-auto min-w-0">
            {filter.content}
          </div>
        ))}
      </div>

      {/* Resultados */}
      <div className="w-full flex justify-end text-white/60 text-sm font-medium">
        {headerBody.results}
      </div>

      {/* Acento marca */}
      <div className="h-1 w-full bg-[#E10600] opacity-90 rounded-full" />
    </div>
  );
};

export default Header;
