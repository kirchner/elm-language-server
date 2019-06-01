#!/usr/bin/env node

import * as Path from "path";
import {
  createConnection,
  DidChangeConfigurationNotification,
  IConnection,
  InitializeParams,
  InitializeResult,
  ProposedFeatures,
} from "vscode-languageserver";
import Parser from "web-tree-sitter";
import { ILanguageServer } from "./server";

export type Runtime = "node" | "electron";
const connection: IConnection = createConnection(ProposedFeatures.all);

connection.onInitialize(
  async (params: InitializeParams): Promise<InitializeResult> => {
    return new Promise<InitializeResult>(async (resolve, reject) => {
      try {
        console.log("Activating tree-sitter...");
        await Parser.init();
        const absolute = Path.join(__dirname, "tree-sitter-elm.wasm");
        const wasm = Path.relative(process.cwd(), absolute);
        console.log("load", wasm);
        const lang = await Parser.Language.load(wasm);
        const parser = new Parser();
        parser.setLanguage(lang);

        const { Server } = await import("./server");
        const server: ILanguageServer = new Server(connection, params, parser);

        resolve(server.capabilities);
      } catch (error) {
        reject();
      }
    });
  },
);

connection.onInitialized(() => {
  // Register for all configuration changes.
  connection.client.register(
    DidChangeConfigurationNotification.type,
    undefined,
  );
});

// Listen on the connection
connection.listen();
