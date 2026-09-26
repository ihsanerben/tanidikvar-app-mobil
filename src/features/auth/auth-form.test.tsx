import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Link } from "expo-router";
import { useNetworkState } from "expo-network";
import { AuthForm } from "./auth-form";
import { registerSchema, verifySchema } from "./schemas";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Text } from "@/components/ui/text";

jest.mock("expo-network", () => ({ useNetworkState: jest.fn() }));
jest.mock("expo-router", () => ({ Link: ({ children }: { children: React.ReactNode }) => children }));
jest.mock("@/components/ui/screen", () => ({ Screen: ({ children }: { children: React.ReactNode }) => children }));
jest.mock("@/components/ui/app-footer", () => ({ AppFooter: () => null }));

describe("auth design and email link behavior", () => {
  let tree: ReactTestRenderer;
  let client: QueryClient;
  beforeEach(() => {
    jest.mocked(useNetworkState).mockReturnValue({ isConnected: true, isInternetReachable: true });
    client = new QueryClient({ defaultOptions: { mutations: { retry: false, gcTime: Infinity } } });
  });
  afterEach(async () => {
    if (tree) await act(async () => tree.unmount());
    client.clear();
  });
  async function renderVerify(token: string, submit: (values: { token: string }) => Promise<unknown>) {
    await act(async () => {
      tree = create(<QueryClientProvider client={client}><AuthForm title="E-postanı doğrula" description=""
        schema={verifySchema} defaults={{ token }} fields={[{ name: "token", label: "Kod", kind: "token", testID: "token" }]}
        submit={submit} submitLabel="Doğrula" testID="verify-submit" /></QueryClientProvider>);
    });
  }
  it("sends the validated email token without displaying an input or the token", async () => {
    const token = "a".repeat(43);
    const submit = jest.fn(async (_values: { token: string }) => undefined);
    await renderVerify(token, submit);
    expect(tree.root.findAllByType(FormField)).toHaveLength(0);
    expect(tree.root.findAllByType(Text).some(node => node.props.children === token)).toBe(false);
    await act(async () => { await tree.root.findByType(Button).props.onPress(); });
    expect(submit).toHaveBeenCalledTimes(1);
    expect(submit.mock.calls[0][0]).toEqual({ token });
  });
  it("keeps submission unavailable when the email link has no token", async () => {
    const submit = jest.fn(async () => undefined);
    await renderVerify("", submit);
    expect(tree.root.findByType(Button).props.disabled).toBe(true);
    expect(tree.root.findAllByType(Text).some(node => String(node.props.children).includes("geçerli bir e-posta bağlantısıyla"))).toBe(true);
    expect(submit).not.toHaveBeenCalled();
  });
  it("keeps the page title and login link after registration succeeds", async () => {
    await act(async () => {
      tree = create(<QueryClientProvider client={client}><AuthForm title="Hesap oluştur" description=""
        schema={registerSchema} defaults={{ email: "ada@example.test", password: "ValidPassword1" }}
        fields={[{ name: "email", label: "E-posta", kind: "email", testID: "email" }, { name: "password", label: "Parola", kind: "new-password", testID: "password" }]}
        submit={async () => undefined} submitLabel="Hesap oluştur" testID="register-submit"
        successTitle="E-postanı doğrula" successMessage="Doğrulama bağlantısı gönderildi."
        links={[{ href: "/login", label: "Oturum aç" }]} /></QueryClientProvider>);
    });
    await act(async () => { await tree.root.findByType(Button).props.onPress(); });
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });
    expect(tree.root.findAllByType(FormField)).toHaveLength(0);
    expect(tree.root.findAllByType(Text).some(node => node.props.children === "Hesap oluştur")).toBe(true);
    expect(tree.root.findByType(Link).props.href).toBe("/login");
  });
});
