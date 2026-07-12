import { render, screen } from "@testing-library/react";

it("renders a div with text ok", () => {
  render(<div>ok</div>);
  expect(screen.getByText("ok")).toBeInTheDocument();
});
