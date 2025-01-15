import * as TJS from "typescript-json-schema";

const generateOpenapiSchema = () => {
    const files = ['node_modules/@types/hafas-client/index.d.ts'];
    const program = TJS.getProgramFromFiles(files);
    const schema = TJS.generateSchema(program, "*", {}, files);
    let components = schema.definitions;
    const openApiSchema = JSON.stringify(components)
        .replaceAll('#/definitions/', '#/components/schemas/')
        .replaceAll(/"type":\[.*?\]/g, '"type":"string"') // type as a list is not valid in OpenAPI, using string as default!
        .replaceAll('"type":"null"', '"type":"string"') // type null is not valid in OpenAPI, using string as default!
        .replaceAll(/"const":"([^"]+)"/g, '"enum":["$1"]'); // const is not valid in OpenAPI, using singular enum!

    return JSON.parse(openApiSchema);
}

export {
    generateOpenapiSchema
}