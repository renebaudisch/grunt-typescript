///<reference path="../typings/gruntjs/gruntjs.d.ts" />
///<reference path="../typings/node/node.d.ts" />
///<reference path="../typings/tsc/tsc.d.ts" />
///<reference path="io.ts" />

module GruntTs{

    var _path = require("path");

    function prepareNewLine(optVal: any): NewLine{
        var val: string;
        if(optVal){
            val = optVal.toString().toUpperCase();
            return val === "CRLF" ? NewLine.crLf :
                   val === "LF" ? NewLine.lf : NewLine.auto;
        }
        return NewLine.auto;
    }

    function prepareIndentStep(optVal: any): number{
        if(Object.prototype.toString.call(optVal) === "[object Number]" && (<number>optVal) > -1 ){
            return <number>optVal;
        }
        return -1;
    }

    function isStr(val: any): boolean{
        return Object.prototype.toString.call(val) === "[object String]";
    }

    function prepareBasePath(opt: any, io: GruntTs.GruntIO): string{
        var optVal: string = "";
        if(isStr(opt.base_path)){
            io.writeWarn("The 'base_path' option will be obsoleted. Please use the 'basePath'.");
            optVal = opt.base_path;
        }
        if(isStr(opt.basePath)){
            optVal = opt.basePath;
        }

        if(!optVal){
            return undefined;
        }
        optVal = io.normalizePath(optVal);
        if(optVal.lastIndexOf("/") !== optVal.length - 1){
            optVal = optVal + "/";
        }
        //TODO: ほんまにいるかチェック
        return io.normalizePath(optVal);
    }

    function prepareSourceMap(opt: any, io: GruntTs.GruntIO): boolean{
        var optVal: boolean = false;
        if(opt.sourcemap){
            io.writeWarn("The 'sourcemap' option will be obsoleted. Please use the 'sourceMap'. (different casing)");
            optVal = !!opt.sourcemap;
        }
        if(opt.sourceMap){
            optVal = !!opt.sourceMap;
        }
        return optVal;
    }

    function prepareNoLib(opt: any, io: GruntTs.GruntIO): boolean{
        var optVal: boolean = false;
        if(opt.nolib){
            io.writeWarn("The 'nolib' option will be obsoleted. Please use the 'noLib'. (different casing)");
            optVal = !!opt.nolib;
        }
        if(opt.noLib){
            optVal = !!opt.noLib;
        }
        return optVal;
    }

    function checkIgnoreTypeCheck(opt: any, io: GruntTs.GruntIO){
        if(typeof opt.ignoreTypeCheck !== "undefined"){
            io.writeWarn("The 'ignoreTypeCheck' option removed. Please use the 'ignoreError'.");
        }
    }

    function prepareIgnoreError(optVal: any): boolean{
        var val = false;
        if(typeof optVal !== "undefined"){
            val = !!optVal;
        }
        return val;
    }

    function prepareNoResolve(optVal: any): boolean{
        var val = false;
        if(typeof optVal !== "undefined"){
            val = !!optVal;
        }
        return val;
    }

    function prepareTarget(optVal: any): TypeScript.LanguageVersion{
        var val:TypeScript.LanguageVersion = undefined;
        if (optVal.target) {
            var temp = (optVal.target + "").toLowerCase();
            if (temp === 'es3') {
                val = TypeScript.LanguageVersion.EcmaScript3;
            } else if (temp == 'es5') {
                val = TypeScript.LanguageVersion.EcmaScript5;
            }
        }
        return val;
    }

    function prepareModule(optVal: any): TypeScript.ModuleGenTarget{
        var val:TypeScript.ModuleGenTarget = undefined;
        if (optVal.module) {
            var temp = (optVal.module + "").toLowerCase();
            if (temp === 'commonjs' || temp === 'node') {
                val = TypeScript.ModuleGenTarget.Synchronous;
            } else if (temp === 'amd') {
                val = TypeScript.ModuleGenTarget.Asynchronous;
            }
        }
        return val;
    }

    export enum NewLine{
        crLf,
        lf,
        auto
    }

    export class Opts{
        public newLine: NewLine;
        public indentStep: number;
        public useTabIndent: boolean;
        public basePath: string;
        public outputOne: boolean;
        public sourceMap: boolean;
        public noLib: boolean;
        public declaration: boolean;
        public removeComments: boolean;
        public noResolve: boolean;
        public ignoreError: boolean;
        public langTarget: TypeScript.LanguageVersion;
        public moduleTarget: TypeScript.ModuleGenTarget;
        public noImplicitAny: boolean;
        public disallowAsi: boolean;

        constructor(private _source: any, private _io: GruntTs.GruntIO, private _dest: string){
            this._source = _source || {};
            this._dest = _io.normalizePath(_dest);

            this.newLine = prepareNewLine(this._source.newLine);
            this.indentStep = prepareIndentStep(this._source.indentStep);
            this.useTabIndent = !!this._source.useTabIndent;
            this.basePath = prepareBasePath(this._source, this._io);
            this.outputOne = !!this._dest && _path.extname(this._dest) === ".js";
            this.noResolve = prepareNoResolve(this._source.noResolve);
            this.sourceMap = prepareSourceMap(this._source, this._io);
            this.noLib = prepareNoLib(this._source, this._io);
            this.declaration = !!this._source.declaration;
            this.removeComments = !this._source.comments;
            this.ignoreError = prepareIgnoreError(this._source.ignoreError);
            this.langTarget = prepareTarget(this._source);
            this.moduleTarget = prepareModule(this._source);
            this.noImplicitAny = typeof this._source.noImplicitAny === "undefined" ? undefined : !!this._source.noImplicitAny;
            this.disallowAsi = typeof this._source.disallowAsi === "undefined" ? undefined : !!this._source.disallowAsi;

            checkIgnoreTypeCheck(this._source, this._io);
        }

        public createCompilationSettings(): TypeScript.ImmutableCompilationSettings{

            var settings = new TypeScript.CompilationSettings(),
                dest = this._dest,
                ioHost = this._io;

            if(this.outputOne){
                settings.outFileOption = _path.resolve(ioHost.currentPath(), dest);
            }

            settings.mapSourceFiles = this.sourceMap;
            settings.generateDeclarationFiles = this.declaration;
            settings.removeComments = this.removeComments;

            if(typeof this.langTarget !== "undefined"){
                settings.codeGenTarget = this.langTarget;
            }
            if(typeof this.moduleTarget !== "undefined"){
                settings.moduleGenTarget = this.moduleTarget;
            }
            if(typeof this.noImplicitAny !== "undefined"){
                settings.noImplicitAny = this.noImplicitAny;
            }
            if(typeof this.disallowAsi !== "undefined"){
                settings.allowAutomaticSemicolonInsertion = this.disallowAsi;
            }

            settings.noLib = this.noLib;
            settings.noResolve = this.noResolve;

            return TypeScript.ImmutableCompilationSettings.fromCompilationSettings(settings);
        }
    }
}