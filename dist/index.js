import Koa from 'koa';
import render from 'koa-ejs';
import * as path from "path";
import request from "request";
import htmlparser2 from 'htmlparser2';
var RuntimeError = WebAssembly.RuntimeError;
const targetUrl = process.env.targetUrl ? process.env.targetUrl : "https://google.com";
const countdown = process.env.countdown ? process.env.countdown : 0;
const port = process.env.port ? process.env.port : 80;
let head;
const app = new Koa();
render(app, {
    root: path.resolve('template'),
    layout: 'index',
    viewExt: 'html',
    cache: true,
    debug: false
});
request(targetUrl, function (error, response, body) {
    if (!error && response.statusCode == 200) {
        console.log("Load Page Success");
        head = parseHead(body);
    }
    else {
        console.log("Load Page Failed");
        throw new RuntimeError();
    }
});
function parseHead(html) {
    let content = "";
    let titleReady = false;
    const parser = new htmlparser2.Parser({
        onopentag(name, attributes) {
            if (name === "link" || name === "meta") {
                let line = "<" + name + " ";
                for (let key in attributes) {
                    line += (key + "=" + attributes[key] + " ");
                }
                line += "/>\n";
                content += line;
            }
            if (name === "title" && titleReady == false) {
                titleReady = true;
            }
        },
        ontext(data) {
            if (titleReady) {
                content += "<title>" + data + "</title>\n";
                titleReady = false;
            }
        }
    });
    parser.write(html);
    parser.end();
    return content;
}
app.use(async function (ctx) {
    await ctx.render('index', {
        head: head,
        target: targetUrl,
        countdown: countdown
    });
});
app.listen(port);
console.log("Start web server at http://localhost:" + port);
