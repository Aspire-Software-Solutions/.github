test('Accepts a follow request', async () => {
    const mockRequest = {
        id: 'request123',
        requesterName: 'John Doe',
        requesterId: 'user456'
    };

    render(
        <Router>
            <FollowRequests requests={[mockRequest]} />
        </Router>
    );

    // Simulate accepting the follow request
    const acceptButton = screen.getByRole('button', { name: /Accept/i });
    fireEvent.click(acceptButton);

    // Ensure that updateDoc was called with the correct parameters to accept the request
    await waitFor(() => {
        expect(updateDoc).toHaveBeenCalled();
        expect(updateDoc).toHaveBeenCalledWith(expect.any(Object), {
            status: 'accepted'
        });
    });

    // Check for visual confirmation that the request was accepted
    await waitFor(() => {
        expect(screen.getByText(/Follow request accepted/i)).toBeInTheDocument();
    });
});

test('Declines a follow request', async () => {
    const mockRequest = {
        id: 'request123',
        requesterName: 'Jane Doe',
        requesterId: 'user789'
    };

    render(
        <Router>
            <FollowRequests requests={[mockRequest]} />
        </Router>
    );

    // Simulate declining the follow request
    const declineButton = screen.getByRole('button', { name: /Decline/i });
    fireEvent.click(declineButton);

    // Ensure that updateDoc was called with the correct parameters to decline the request
    await waitFor(() => {
        expect(updateDoc).toHaveBeenCalled();
        expect(updateDoc).toHaveBeenCalledWith(expect.any(Object), {
            status: 'declined'
        });
    });

    // Check for visual confirmation that the request was declined
    await waitFor(() => {
        expect(screen.getByText(/Follow request declined/i)).toBeInTheDocument();
    });
});