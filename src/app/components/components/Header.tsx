import Buttons from "./Buttons"

const Header = ({ headerBody }: any) => {
  return (
    <div className="h-auto mb-2 bg-white p-3 flex flex-col gap-3 mx-4 shadow-md rounded-lg text-xs font-semibold">
      {/* Sección de Botones */}
      <div className="flex flex-wrap justify-end items-center w-full border-b border-gray-200 pb-3 gap-2">
        {headerBody.buttons.map((button: any, index: any) => (
          <Buttons key={index} logo={button.logo} title={button.title} onClick={button.onClick} red={button.red} />
        ))}
      </div>

      {/* Segunda Sección */}
      {headerBody.secondSection && (
        <div className="flex justify-between items-center w-full border-b border-gray-200 pb-3">
          <div className="flex items-center gap-2">
            <p className="font-medium text-gray-600">
              {headerBody.secondSection.title}
              <span className="font-bold pl-2 text-lg text-red-600">{headerBody.secondSection.amount}</span>
            </p>
          </div>
          {headerBody.secondSection.total && (
            <div className="font-medium text-gray-600 text-xs">{headerBody.secondSection.total}</div>
          )}
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap justify-start items-center w-full gap-2 p-2 rounded">
        {headerBody.filters.map((filter: any, index: any) => (
          <div key={index} className="w-full sm:w-auto">
            {filter.content}
          </div>
        ))}
      </div>

      {/* Resultados */}
      <div className="w-full flex justify-end text-gray-500 text-xs">{headerBody.results}</div>
    </div>
  )
}

export default Header