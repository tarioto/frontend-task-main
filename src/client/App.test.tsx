import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { axe } from 'vitest-axe';

import { App } from './App';

describe('App', () => {
    it('should render the component', () => {
        const { getByText } = render(<App />);

        expect(getByText('Hello there')).toBeInTheDocument();
        expect(getByText(/everything brand starts small/i)).toBeInTheDocument();
    });

    it('should have no detectable accessibility violations', async () => {
        const { container } = render(<App />);

        expect(await axe(container)).toHaveNoViolations();
    });
});
