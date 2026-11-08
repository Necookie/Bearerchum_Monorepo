/* Bearerchum judge worker — runs student Python in Pyodide (CPython compiled to WebAssembly).
 * Protocol:  {type:"init"} -> {type:"ready", version}
 *            {type:"run", id, code, input:[lines]} -> {type:"result", id, out, err, ms}
 * The main thread enforces time limits by terminating this worker. */
const PYODIDE_VERSION = "0.27.7";
importScripts(`https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/pyodide.js`);

const HARNESS = `
import sys, io, builtins, traceback

def __bearer_run(code, lines):
    out = io.StringIO()
    err_stream = io.StringIO()
    feed = iter(list(lines))

    def _input(prompt=""):
        out.write(str(prompt))
        try:
            line = next(feed)
        except StopIteration:
            raise EOFError("input() was called more times than this test has lines")
        out.write(line + "\\n")          # echo, like CodeChum's sample box
        return line

    saved = (sys.stdout, sys.stderr, builtins.input)
    sys.stdout, sys.stderr, builtins.input = out, err_stream, _input
    error = None
    try:
        exec(compile(code, "script.py", "exec"), {"__name__": "__main__"})
    except SystemExit:
        pass
    except BaseException as e:
        tb = e.__traceback__
        while tb is not None and tb.tb_frame.f_code.co_filename != "script.py":
            tb = tb.tb_next
        error = "".join(traceback.format_exception(type(e), e, tb))
    finally:
        sys.stdout, sys.stderr, builtins.input = saved
    return [out.getvalue(), error, err_stream.getvalue()]
`;

let py = null;

self.onmessage = async (e) => {
  const msg = e.data;
  if (msg.type === "init") {
    try {
      py = await loadPyodide();
      py.runPython(HARNESS);
      self.postMessage({ type: "ready", version: py.version });
    } catch (err) {
      self.postMessage({ type: "fatal", error: String(err) });
    }
    return;
  }
  if (msg.type === "run") {
    const t0 = performance.now();
    let fn, res;
    try {
      fn = py.globals.get("__bearer_run");
      res = fn(msg.code, py.toPy(msg.input));
      const [out, err, stderr] = res.toJs();
      self.postMessage({ type: "result", id: msg.id, out, err, stderr, ms: performance.now() - t0 });
    } catch (err) {
      self.postMessage({ type: "result", id: msg.id, out: "", err: String(err), stderr: "", ms: performance.now() - t0 });
    } finally {
      if (res && res.destroy) res.destroy();
      if (fn && fn.destroy) fn.destroy();
    }
  }
};
