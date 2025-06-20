import { Vts } from 'vts';
export var ENV_DUTY_DB;
(function (ENV_DUTY_DB) {
    ENV_DUTY_DB["DB_MYSQL_USERNAME"] = "DB_MYSQL_USERNAME";
    ENV_DUTY_DB["DB_MYSQL_PASSWORD"] = "DB_MYSQL_PASSWORD";
    ENV_DUTY_DB["DB_MYSQL_DATABASE"] = "DB_MYSQL_DATABASE";
})(ENV_DUTY_DB || (ENV_DUTY_DB = {}));
export var ENV_OPTIONAL_DB;
(function (ENV_OPTIONAL_DB) {
    ENV_OPTIONAL_DB["DB_MYSQL_HOST"] = "DB_MYSQL_HOST";
    ENV_OPTIONAL_DB["DB_MYSQL_PORT"] = "DB_MYSQL_PORT";
    ENV_OPTIONAL_DB["DB_INFLUX_URL"] = "DB_INFLUX_URL";
    ENV_OPTIONAL_DB["DB_INFLUX_TOKEN"] = "DB_INFLUX_TOKEN";
    ENV_OPTIONAL_DB["DB_INFLUX_ORG"] = "DB_INFLUX_ORG";
    ENV_OPTIONAL_DB["DB_INFLUX_BUCKET"] = "DB_INFLUX_BUCKET";
    ENV_OPTIONAL_DB["DB_REDIS_URL"] = "DB_REDIS_URL";
    ENV_OPTIONAL_DB["DB_REDIS_PASSWORD"] = "DB_REDIS_PASSWORD";
})(ENV_OPTIONAL_DB || (ENV_OPTIONAL_DB = {}));
export const SchemaConfigDbOptionsMySql = Vts.object({
    host: Vts.string(),
    port: Vts.number(),
    username: Vts.string(),
    password: Vts.string(),
    database: Vts.string()
});
export const SchemaConfigDbOptionsInflux = Vts.object({
    url: Vts.string(),
    token: Vts.string(),
    org: Vts.string(),
    bucket: Vts.string(),
    username: Vts.string(),
    password: Vts.string()
});
export const SchemaConfigDbOptionsRedis = Vts.object({
    url: Vts.string(),
    password: Vts.optional(Vts.string())
});
export const SchemaConfigDbOptionsChroma = Vts.object({
    url: Vts.string()
});
export const SchemaConfigDbOptions = Vts.object({
    mysql: SchemaConfigDbOptionsMySql,
    influx: Vts.optional(SchemaConfigDbOptionsInflux),
    redis: Vts.optional(SchemaConfigDbOptionsRedis),
    chroma: Vts.optional(SchemaConfigDbOptionsChroma)
});
//# sourceMappingURL=ConfigDb.js.map