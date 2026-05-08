// To parse this data:
//
//   import { Convert, Types } from "./file";
//
//   const types = Convert.toTypes(json);
//
// These functions will throw an error if the JSON doesn't
// match the expected interface, even if the JSON is valid.

export interface Types {
    name:                 string;
    description:          string;
    dependencies:         Dependencies;
    devDependencies:      DevDependencies;
    peerDependencies:     PeerDependencies;
    peerDependenciesMeta: PeerDependenciesMeta;
}

export interface Dependencies {
    elysia:                     string;
    "env-var":                  string;
    "@prisma/client":           string;
    "drizzle-orm":              string;
    pg:                         string;
    postgres:                   string;
    mysql2:                     string;
    "@elysiajs/bearer":         string;
    "@elysiajs/cors":           string;
    "@elysiajs/html":           string;
    "@kitajs/ts-html-plugin":   string;
    "@elysiajs/jwt":            string;
    "@elysiajs/server-timing":  string;
    "@elysiajs/static":         string;
    "@elysiajs/swagger":        string;
    "elysia-autoload":          string;
    "@bogeychan/elysia-logger": string;
    "elysia-oauth2":            string;
    arctic:                     string;
    "@gramio/init-data":        string;
    ioredis:                    string;
    "@verrou/core":             string;
    "@aws-sdk/client-s3":       string;
    "posthog-node":             string;
    jobify:                     string;
    gramio:                     string;
}

export interface DevDependencies {
    typescript:              string;
    "@types/bun":            string;
    "@biomejs/biome":        string;
    eslint:                  string;
    "@antfu/eslint-config":  string;
    "eslint-plugin-drizzle": string;
    prisma:                  string;
    "drizzle-kit":           string;
    "@types/pg":             string;
    husky:                   string;
    "ioredis-mock":          string;
    "@electric-sql/pglite":  string;
    "@elysiajs/eden":        string;
}

export interface PeerDependencies {
    typescript: string;
}

export interface PeerDependenciesMeta {
    typescript: Typescript;
}

export interface Typescript {
    optional: boolean;
}

// Converts JSON strings to/from your types
// and asserts the results of JSON.parse at runtime
export class Convert {
    public static toTypes(json: string): Types {
        return cast(JSON.parse(json), r("Types"));
    }

    public static typesToJson(value: Types): string {
        return JSON.stringify(uncast(value, r("Types")), null, 2);
    }
}

function invalidValue(typ: any, val: any, key: any, parent: any = ''): never {
    const prettyTyp = prettyTypeName(typ);
    const parentText = parent ? ` on ${parent}` : '';
    const keyText = key ? ` for key "${key}"` : '';
    throw Error(`Invalid value${keyText}${parentText}. Expected ${prettyTyp} but got ${JSON.stringify(val)}`);
}

function prettyTypeName(typ: any): string {
    if (Array.isArray(typ)) {
        if (typ.length === 2 && typ[0] === undefined) {
            return `an optional ${prettyTypeName(typ[1])}`;
        } else {
            return `one of [${typ.map(a => { return prettyTypeName(a); }).join(", ")}]`;
        }
    } else if (typeof typ === "object" && typ.literal !== undefined) {
        return typ.literal;
    } else {
        return typeof typ;
    }
}

function jsonToJSProps(typ: any): any {
    if (typ.jsonToJS === undefined) {
        const map: any = {};
        typ.props.forEach((p: any) => map[p.json] = { key: p.js, typ: p.typ });
        typ.jsonToJS = map;
    }
    return typ.jsonToJS;
}

function jsToJSONProps(typ: any): any {
    if (typ.jsToJSON === undefined) {
        const map: any = {};
        typ.props.forEach((p: any) => map[p.js] = { key: p.json, typ: p.typ });
        typ.jsToJSON = map;
    }
    return typ.jsToJSON;
}

function transform(val: any, typ: any, getProps: any, key: any = '', parent: any = ''): any {
    function transformPrimitive(typ: string, val: any): any {
        if (typeof typ === typeof val) return val;
        return invalidValue(typ, val, key, parent);
    }

    function transformUnion(typs: any[], val: any): any {
        // val must validate against one typ in typs
        const l = typs.length;
        for (let i = 0; i < l; i++) {
            const typ = typs[i];
            try {
                return transform(val, typ, getProps);
            } catch (_) {}
        }
        return invalidValue(typs, val, key, parent);
    }

    function transformEnum(cases: string[], val: any): any {
        if (cases.indexOf(val) !== -1) return val;
        return invalidValue(cases.map(a => { return l(a); }), val, key, parent);
    }

    function transformArray(typ: any, val: any): any {
        // val must be an array with no invalid elements
        if (!Array.isArray(val)) return invalidValue(l("array"), val, key, parent);
        return val.map(el => transform(el, typ, getProps));
    }

    function transformDate(val: any): any {
        if (val === null) {
            return null;
        }
        const d = new Date(val);
        if (isNaN(d.valueOf())) {
            return invalidValue(l("Date"), val, key, parent);
        }
        return d;
    }

    function transformObject(props: { [k: string]: any }, additional: any, val: any): any {
        if (val === null || typeof val !== "object" || Array.isArray(val)) {
            return invalidValue(l(ref || "object"), val, key, parent);
        }
        const result: any = {};
        Object.getOwnPropertyNames(props).forEach(key => {
            const prop = props[key];
            const v = Object.prototype.hasOwnProperty.call(val, key) ? val[key] : undefined;
            result[prop.key] = transform(v, prop.typ, getProps, key, ref);
        });
        Object.getOwnPropertyNames(val).forEach(key => {
            if (!Object.prototype.hasOwnProperty.call(props, key)) {
                result[key] = transform(val[key], additional, getProps, key, ref);
            }
        });
        return result;
    }

    if (typ === "any") return val;
    if (typ === null) {
        if (val === null) return val;
        return invalidValue(typ, val, key, parent);
    }
    if (typ === false) return invalidValue(typ, val, key, parent);
    let ref: any = undefined;
    while (typeof typ === "object" && typ.ref !== undefined) {
        ref = typ.ref;
        typ = typeMap[typ.ref];
    }
    if (Array.isArray(typ)) return transformEnum(typ, val);
    if (typeof typ === "object") {
        return typ.hasOwnProperty("unionMembers") ? transformUnion(typ.unionMembers, val)
            : typ.hasOwnProperty("arrayItems")    ? transformArray(typ.arrayItems, val)
            : typ.hasOwnProperty("props")         ? transformObject(getProps(typ), typ.additional, val)
            : invalidValue(typ, val, key, parent);
    }
    // Numbers can be parsed by Date but shouldn't be.
    if (typ === Date && typeof val !== "number") return transformDate(val);
    return transformPrimitive(typ, val);
}

function cast<T>(val: any, typ: any): T {
    return transform(val, typ, jsonToJSProps);
}

function uncast<T>(val: T, typ: any): any {
    return transform(val, typ, jsToJSONProps);
}

function l(typ: any) {
    return { literal: typ };
}

function a(typ: any) {
    return { arrayItems: typ };
}

function u(...typs: any[]) {
    return { unionMembers: typs };
}

function o(props: any[], additional: any) {
    return { props, additional };
}

function m(additional: any) {
    return { props: [], additional };
}

function r(name: string) {
    return { ref: name };
}

const typeMap: any = {
    "Types": o([
        { json: "name", js: "name", typ: "" },
        { json: "description", js: "description", typ: "" },
        { json: "dependencies", js: "dependencies", typ: r("Dependencies") },
        { json: "devDependencies", js: "devDependencies", typ: r("DevDependencies") },
        { json: "peerDependencies", js: "peerDependencies", typ: r("PeerDependencies") },
        { json: "peerDependenciesMeta", js: "peerDependenciesMeta", typ: r("PeerDependenciesMeta") },
    ], false),
    "Dependencies": o([
        { json: "elysia", js: "elysia", typ: "" },
        { json: "env-var", js: "env-var", typ: "" },
        { json: "@prisma/client", js: "@prisma/client", typ: "" },
        { json: "drizzle-orm", js: "drizzle-orm", typ: "" },
        { json: "pg", js: "pg", typ: "" },
        { json: "postgres", js: "postgres", typ: "" },
        { json: "mysql2", js: "mysql2", typ: "" },
        { json: "@elysiajs/bearer", js: "@elysiajs/bearer", typ: "" },
        { json: "@elysiajs/cors", js: "@elysiajs/cors", typ: "" },
        { json: "@elysiajs/html", js: "@elysiajs/html", typ: "" },
        { json: "@kitajs/ts-html-plugin", js: "@kitajs/ts-html-plugin", typ: "" },
        { json: "@elysiajs/jwt", js: "@elysiajs/jwt", typ: "" },
        { json: "@elysiajs/server-timing", js: "@elysiajs/server-timing", typ: "" },
        { json: "@elysiajs/static", js: "@elysiajs/static", typ: "" },
        { json: "@elysiajs/swagger", js: "@elysiajs/swagger", typ: "" },
        { json: "elysia-autoload", js: "elysia-autoload", typ: "" },
        { json: "@bogeychan/elysia-logger", js: "@bogeychan/elysia-logger", typ: "" },
        { json: "elysia-oauth2", js: "elysia-oauth2", typ: "" },
        { json: "arctic", js: "arctic", typ: "" },
        { json: "@gramio/init-data", js: "@gramio/init-data", typ: "" },
        { json: "ioredis", js: "ioredis", typ: "" },
        { json: "@verrou/core", js: "@verrou/core", typ: "" },
        { json: "@aws-sdk/client-s3", js: "@aws-sdk/client-s3", typ: "" },
        { json: "posthog-node", js: "posthog-node", typ: "" },
        { json: "jobify", js: "jobify", typ: "" },
        { json: "gramio", js: "gramio", typ: "" },
    ], false),
    "DevDependencies": o([
        { json: "typescript", js: "typescript", typ: "" },
        { json: "@types/bun", js: "@types/bun", typ: "" },
        { json: "@biomejs/biome", js: "@biomejs/biome", typ: "" },
        { json: "eslint", js: "eslint", typ: "" },
        { json: "@antfu/eslint-config", js: "@antfu/eslint-config", typ: "" },
        { json: "eslint-plugin-drizzle", js: "eslint-plugin-drizzle", typ: "" },
        { json: "prisma", js: "prisma", typ: "" },
        { json: "drizzle-kit", js: "drizzle-kit", typ: "" },
        { json: "@types/pg", js: "@types/pg", typ: "" },
        { json: "husky", js: "husky", typ: "" },
        { json: "ioredis-mock", js: "ioredis-mock", typ: "" },
        { json: "@electric-sql/pglite", js: "@electric-sql/pglite", typ: "" },
        { json: "@elysiajs/eden", js: "@elysiajs/eden", typ: "" },
    ], false),
    "PeerDependencies": o([
        { json: "typescript", js: "typescript", typ: "" },
    ], false),
    "PeerDependenciesMeta": o([
        { json: "typescript", js: "typescript", typ: r("Typescript") },
    ], false),
    "Typescript": o([
        { json: "optional", js: "optional", typ: true },
    ], false),
};
