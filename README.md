### Installation

```bash
npm install @ivorpad/nestjs-cookies-fastify
```

### Motivation
NestJS doesn't currently have decorators for getting and setting cookies.  While it's not
too hard to read cookies, it's convenient to have a parameter decorator to do so.

```typescript
@Post('login')
login(@Cookies() cookies) {
  console.log('Got cookies:', cookies);
}
```

Setting cookies is a little less straightforward.  You either need to utilize the platform-specific
response (`res`) object, or write an interceptor. The former is pretty straightforward, though
takes a non-Nest-like imperative style.  It also puts you into
[manual response mode](https://docs.nestjs.com/controllers#routing),
meaning you can no longer rely on features like `@Render()`, `@HttpCode()` or [interceptors that modify the response](https://docs.nestjs.com/interceptors#response-mapping),
and makes testing harder (you'll have to mock the response
object, etc.).  The `@SetCookies()` decorator from this package wraps an interceptor
in a declarative decorator that solves these issues.

Collectively, the `@Cookies()`, `@SignedCookies()`, `@SetCookies()` and `@ClearCookies()` decorators in this package
provide a convenient set of features that make it easier to manage cookies in a standard and declarative way,
and minimize boilerplate code.

### See Also
If you like these decorators, you may also be interested in the
[NestJS Redirect decorator](https://github.com/nestjsplus/redirect).


### Importing the Decorators
Import the decorators, just as you would other Nest decorators, in the controllers
that use them as shown below:

```typescript
import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Cookies, SignedCookies } from '@nestjsplus/cookies';

@Controller()
export class AppController {
...
```

### Reading Cookies
Reading cookies requires the [fastify-cookie](https://github.com/fastify/fastify-cookie)
package to be installed.

#### Cookies
Use the `@Cookies()` route parameter decorator to get "regular" cookies.
```typescript
@Get('get')
get(@Cookies() cookies): string {
  console.log('cookies: ', cookies);
  return this.appService.getHello();
}
```

This will bind an array of **all** (non-signed) cookies to the `cookies` parameter.
See [below](#accessing-specific-named-cookies) to access a named cookie.

### Setting Cookies
Use the `@SetCookies()` route handler *method decorator* to set cookies.

Here's the API:
```typescript
@SetCookies(
  options?: CookieOptions,
  cookies?: CookieSettings | CookieSettings[]
)
```

Here's how it works. You have two options, depending on whether the cookie settings
are static or dynamic.
1. For *static* cookies, where the cookie name and/or value are known at compile time,
you can set them in the `@SetCookies()` decorator by passing a [CookieSettings](#cookie-settings)
object.

    <br/>For example:
```typescript
@SetCookies({name: 'cookie1', value: 'cookie 1 value'})
@Get('set')
set() {
  ...
}
```

2. For *dynamic* cookies, where the cookie name and/or value are computed at run-time,
you can provide the cookie name/value pairs to be set when the
route handler method runs.  Provide these values by passing them on the `req._cookies`
array property.  (The decorator creates the `_cookies` property automatically for you).
**Note:** Of course if you are using this technique, you are de facto accessing
the `request` object, so you must bind `@Request()` to a route parameter.

    <br/>For example:

```typescript
set(@Request() req) {
  const cookie1Value = 'chocoloate chip';
  req._cookies = [
    {
      name: 'cookie1',
      value: cookie1Value,
      options: {
        signed: true,
        sameSite: true,
      },
    },
    { name: 'cookie2', value: 'oatmeal raisin' },
  ];
  ...
```

#### Defaults and overriding
You can mix and match `CookieOptions` and `CookieSettings` in the decorator and
in the method body as needed.  This example
shows *dynamic* cookies with defaults inherited from the decorator, and
overrides in the body:
```typescript
@SetCookies({httpOnly: true},
 [
   {name: 'cookie1', value: 'cookie 1 value'},
   {name: 'cookie2', value: 'cookie 2 value', {httpOnly: false}}
 ]
)
```
As a result of the above, `cookie1` will be set as `HttpOnly`, but `cookie2` will not.

- Set default [cookie options](#cookieoptions) by passing a
`CookieOptions` object in the decorator. Options set on individual cookies,
if provided, override these defaults.

#### Cookie Settings
As shown above, each cookie you set has the shape:
```typescript
interface CookieSettings {
  /**
   * name of the cookie.
   */
  name: string;
  /**
   * value of the cookie.
   */
  value?: string;
  /**
   * cookie options.
   */
  options?: CookieOptions;
}
```
If `options` are provided for a cookie, they completely replace any options
specified in the `@SetCookies()` decorator.  If omitted for a cookie, they default
to options specified on the `@SetCookies()` decorator.

#### CookieOptions
Cookie options may be set at the method level (`@SetCookies()`), providing a set of
defaults, or for individual cookies. In either case, they have the following shape:
```typescript
interface CookieOptions {
  /**
   * Domain name for the cookie.
   */
  domain?: string;
  /**
   * 	A synchronous function used for cookie value encoding. Defaults to encodeURIComponent.
   */
  encode?: (val: string) => string;
  /**
   * Expiry date of the cookie in GMT. If not specified or set to 0, creates a session cookie.
   */
  expires?: Date;
  /**
   * Flags the cookie to be accessible only by the web server.
   */
  httpOnly?: boolean;
  /**
   * Convenient option for setting the expiry time relative to the current time in milliseconds.
   */
  maxAge?: number;
  /**
   * Path for the cookie. Defaults to “/”.
   */
  path?: string;
  /**
   * Marks the cookie to be used with HTTPS only.
   */
  secure?: boolean;
  /**
   * Indicates if the cookie should be signed.
   */
  signed?: boolean;
  /**
   * Value of the “SameSite” Set-Cookie attribute. More information at
   * https://tools.ietf.org/html/draft-ietf-httpbis-cookie-same-site-00#section-4.1.1.
   */
  sameSite?: boolean | string;
}
```
#### Route Handler Results and Behavior
The route handler otherwise proceeds as normal. It can return values, and it can
use other route handler method decorators (such as `@Render()`) and other route
parameter decorators (such as `@Headers()`, `@Query()`).

#### Example
Setting cookies isn't hard!  See a [full example here in the test folder](https://github.com/nestjsplus/cookies/blob/master/test/src/app.controller.ts).

### Clearing (deleting) Cookies

Delete cookies in one of two ways:
1. Use `@SetCookies()` and pass in **only** the cookie name (leave the value property
off of the object).
2. Use `@ClearCookies()`, passing in a comma separated list of cookies to clear.
```typescript
@ClearCookies('cookie1', 'cookie2')
@Get('kill')
@Render('clear')
kill() {
  return { message: 'cookies killed!' };
}
```

## Author

- **John Biundo (Y Prospect on [Discord](https://discord.gg/G7Qnnhy))**

## License

Licensed under the MIT License - see the [LICENSE](LICENSE) file for details.