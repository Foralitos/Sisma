import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const host = req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") ?? "http";
  const baseUrl = `${proto}://${host}`;

  const spec = {
    openapi: "3.0.1",
    info: {
      title: "Sismos CDMX API",
      description:
        "Consulta sismos históricos de la Ciudad de México (1990-2024) del catálogo SSN-UNAM. Úsala para buscar eventos sísmicos por magnitud, fecha y proximidad geográfica.",
      version: "1.0.0",
    },
    servers: [{ url: baseUrl }],
    paths: {
      "/api/sismos/query": {
        get: {
          operationId: "query_sismos",
          summary: "Consultar sismos históricos de CDMX",
          description:
            "Recupera sismos históricos de la Ciudad de México filtrados por magnitud, rango de fechas y opcionalmente por proximidad geográfica. Devuelve la lista de sismos y el total encontrado.",
          parameters: [
            {
              name: "magnitudMin",
              in: "query",
              required: false,
              description: "Magnitud mínima (default: 0)",
              schema: { type: "number", example: 2.5 },
            },
            {
              name: "magnitudMax",
              in: "query",
              required: false,
              description: "Magnitud máxima (default: 10)",
              schema: { type: "number", example: 5.0 },
            },
            {
              name: "fechaDesde",
              in: "query",
              required: false,
              description: "Fecha inicio YYYY-MM-DD (default: 1990-01-01)",
              schema: { type: "string", example: "2010-01-01" },
            },
            {
              name: "fechaHasta",
              in: "query",
              required: false,
              description: "Fecha fin YYYY-MM-DD (default: hoy)",
              schema: { type: "string", example: "2024-12-31" },
            },
            {
              name: "latitud",
              in: "query",
              required: false,
              description: "Latitud del punto de referencia para búsqueda geoespacial. Requiere longitud.",
              schema: { type: "number", example: 19.43 },
            },
            {
              name: "longitud",
              in: "query",
              required: false,
              description: "Longitud del punto de referencia para búsqueda geoespacial. Requiere latitud.",
              schema: { type: "number", example: -99.13 },
            },
            {
              name: "radioKm",
              in: "query",
              required: false,
              description: "Radio de búsqueda en km alrededor de las coordenadas (default: 50)",
              schema: { type: "number", example: 30 },
            },
            {
              name: "limit",
              in: "query",
              required: false,
              description: "Máx. sismos a devolver, tope 100 (default: 20)",
              schema: { type: "integer", example: 10 },
            },
          ],
          responses: {
            200: {
              description: "Lista de sismos encontrados",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      total: { type: "integer" },
                      sismos: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            fecha: { type: "string", format: "date-time" },
                            magnitud: { type: "number" },
                            latitud: { type: "number" },
                            longitud: { type: "number" },
                            profundidad: { type: "number" },
                            referenciaLocalizacion: { type: "string" },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            401: { description: "API key inválida o faltante" },
            400: { description: "Parámetros inválidos" },
            500: { description: "Error interno del servidor" },
          },
        },
      },
    },
    components: {},
  };

  return NextResponse.json(spec);
}
