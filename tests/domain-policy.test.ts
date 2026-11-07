import { test } from "node:test";
import assert from "node:assert/strict";
import {
  configuredCookieDomain,
  hubDomainReady,
} from "../apps/hub/src/lib/domains";
import { mailConfiguration } from "../apps/hub/src/lib/mail";
test("production rejects public suffixes, insecure origins and local email sinks", () => {
  const saved = {
    APP_ENV: process.env.APP_ENV,
    HUB_URL: process.env.HUB_URL,
    SESSION_COOKIE_DOMAIN: process.env.SESSION_COOKIE_DOMAIN,
    MAIL_PROVIDER: process.env.MAIL_PROVIDER,
  };
  try {
    process.env.APP_ENV = "production";
    process.env.HUB_URL = "https://hub.example.com";
    for (const domain of [
      ".com",
      ".co.uk",
      ".workers.dev",
      ".github.io",
      ".example.com/evil",
      ".example.com:443",
    ]) {
      process.env.SESSION_COOKIE_DOMAIN = domain;
      assert.throws(configuredCookieDomain);
      assert.equal(hubDomainReady(), false);
    }
    process.env.SESSION_COOKIE_DOMAIN = ".example.com";
    assert.equal(configuredCookieDomain(), "example.com");
    assert.equal(hubDomainReady(), true);
    process.env.HUB_URL = "http://hub.example.com";
    assert.equal(hubDomainReady(), false);
    process.env.HUB_URL = "https://hub.attacker.com";
    assert.equal(hubDomainReady(), false);
    process.env.HUB_URL = "https://hub.example.com";
    process.env.MAIL_PROVIDER = "mailpit";
    assert.throws(mailConfiguration);
  } finally {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
