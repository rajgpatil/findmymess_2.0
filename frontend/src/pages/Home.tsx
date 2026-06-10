const Home = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-4xl font-bold mb-4">Welcome to FindMyMess!</h1>
      <p className="text-lg text-gray-600 mb-8">
        Your one-stop solution for finding the best mess in town.
      </p>
      <a
        href="/login"
        className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-300"
      >
        Get Started
      </a>
    </div>
  );
};

export default Home;
