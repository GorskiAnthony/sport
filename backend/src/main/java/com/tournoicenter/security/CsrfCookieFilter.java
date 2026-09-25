package com.tournoicenter.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/** Spring Security 6+ resolves the CSRF token lazily — the XSRF-TOKEN cookie is only actually
 *  written once something reads CsrfToken#getToken(). Nothing in this API-only backend does
 *  that on its own (no server-rendered form uses the token), so without this filter the cookie
 *  the Angular clients need would never appear. This is the request-forcing filter documented
 *  in Spring Security's own "CSRF for a Single Page Application" guide. */
public class CsrfCookieFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        CsrfToken csrfToken = (CsrfToken) request.getAttribute(CsrfToken.class.getName());
        if (csrfToken != null) {
            csrfToken.getToken();
        }
        filterChain.doFilter(request, response);
    }
}
