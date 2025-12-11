"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiResponse = void 0;
class ApiResponse {
    constructor(data, message = "Success") {
        this.message = message;
        this.data = data;
    }
}
exports.ApiResponse = ApiResponse;
