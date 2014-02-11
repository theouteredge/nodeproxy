using cmdR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;

namespace Cmds
{
    class Program
    {
        static void Main(string[] args)
        {
            var cmdR = new CmdR("\n> ");
            cmdR.RegisterRoute("set host port", (param, cmd) =>
            {
                if (cmdR.State.Variables.ContainsKey("host"))
                    cmdR.State.Variables["host"] = param["host"];
                else
                    cmdR.State.Variables.Add("host", param["host"]);

                if (cmdR.State.Variables.ContainsKey("port"))
                    cmdR.State.Variables["port"] = int.Parse(param["port"]);
                else
                    cmdR.State.Variables.Add("port", int.Parse(param["port"]));
            });

            cmdR.RegisterRoute("connect url", (param, cmd) =>
            {
                if (cmdR.State.Variables.ContainsKey("host") && cmdR.State.Variables.ContainsKey("port"))
                {
                    var wc = new WebClient();
                    wc.Proxy = new WebProxy(new Uri(string.Format("http://{0}:{1}", cmdR.State.Variables["host"], (int)cmdR.State.Variables["port"])));

                    try
                    {
                        var html = "";
                        html = wc.DownloadString(param["url"]);

                        cmdR.Console.WriteLine(html.Substring(0, Math.Min(100, html.Length - 1)));
                    }
                    catch (Exception e)
                    {
                        cmdR.Console.WriteLine("An exception was thrown: {0}", e.Message);
                    }
                }
                else cmdR.Console.WriteLine("No proxy server set, please use the set to specify the proxy servers settings");
            });


            cmdR.Run(args);
        }
    }
}
