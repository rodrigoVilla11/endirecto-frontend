export default function VehicleTable({ vehicles }: any) {
  return (
    <table className="min-w-full bg-white">
      <thead>
        <tr className="text-xs">
          <th className="py-2 px-2 bg-gray-200 text-left">Marca</th>
          <th className="py-2 px-2 bg-gray-200 text-left">Modelo</th>
          <th className="py-2 px-2 bg-gray-200 text-left">Motor</th>
          <th className="py-2 px-2 bg-gray-200 text-left">Año</th>
        </tr>
      </thead>
      <tbody className="text-xs">

        {vehicles.map((vehicle: any, index: any) => (
          <tr
            key={index}
            className={`border-b last:border-b-0 ${
              index % 2 === 0 ? "bg-white" : "bg-gray-50"
            }`}
          >
            <td className="border-t py-2 px-2">{vehicle.brand}</td>
            <td className="border-t py-2 px-2">{vehicle.model}</td>
            <td className="border-t py-2 px-2">{vehicle.engine}</td>
            <td className="border-t py-2 px-2">{vehicle.year}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
