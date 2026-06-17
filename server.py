import http.server, os, sys
os.chdir('/Users/joshuaomosebi/Downloads/www-sebaagency-com')
port = int(sys.argv[1]) if len(sys.argv) > 1 else 3456
handler = http.server.SimpleHTTPRequestHandler
http.server.test(HandlerClass=handler, port=port, bind='127.0.0.1')
