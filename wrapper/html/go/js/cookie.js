function set_cookie(B, G, I, F, H, J, E, A) {
        var D = B + "=" + escape(G);
        if (I) {
                var C = new Date(I, F, H);
                D += "; expires=" + C.toGMTString()
        }
        if(J) {
                D += "; path=" + escape(J)
        }
        if (E) {
                D += "; domain=" + escape(E)
        }
        if (A) {
                D += "; secure"
        }
        document.cookie = D
}
function delete_cookie(B) {
        var A = new Date();
        A.setTime(A.getTime() - 1);
        document.cookie = B += "=; expires=" + A.toGMTString()
}
function get_cookie(B) {
        var A = document.cookie.match("(^|;) ? " + B + "=([^;]*)(;|$)");
        if (A) {
                return(unescape(A[2]))
        } else {
                return null
        }
};