/**
 * Sample React component test using Testing Library
 * This demonstrates how to test React components with Jest
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "../ui/Button";

describe("Button Component", () => {
  it("should render button with text", () => {
    render(<Button>Click me</Button>);

    const button = screen.getByRole("button", { name: /click me/i });
    expect(button).toBeInTheDocument();
  });

  it("should handle click events", () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    const button = screen.getByRole("button", { name: /click me/i });
    fireEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("should be disabled when disabled prop is true", () => {
    render(<Button disabled>Disabled button</Button>);

    const button = screen.getByRole("button", { name: /disabled button/i });
    expect(button).toBeDisabled();
  });

  it("should apply variant classes", () => {
    render(<Button variant="primary">Primary button</Button>);

    const button = screen.getByRole("button", { name: /primary button/i });
    expect(button).toHaveClass("bg-blue-600");
  });

  it("should show loading state", () => {
    render(<Button loading>Loading button</Button>);

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();

    // Check for loading spinner
    const spinner = screen.getByRole("status", { hidden: true });
    expect(spinner).toBeInTheDocument();
  });

  it("should handle different sizes", () => {
    const { rerender } = render(<Button size="sm">Small button</Button>);

    let button = screen.getByRole("button", { name: /small button/i });
    expect(button).toHaveClass("px-3", "py-1.5", "text-sm");

    rerender(<Button size="lg">Large button</Button>);

    button = screen.getByRole("button", { name: /large button/i });
    expect(button).toHaveClass("px-6", "py-3", "text-lg");
  });

  it("should accept custom className", () => {
    render(<Button className="custom-class">Custom button</Button>);

    const button = screen.getByRole("button", { name: /custom button/i });
    expect(button).toHaveClass("custom-class");
  });

  it("should forward ref correctly", () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(<Button ref={ref}>Button with ref</Button>);

    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    expect(ref.current).toHaveTextContent("Button with ref");
  });
});
